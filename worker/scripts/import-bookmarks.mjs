/**
 * import-bookmarks.mjs
 * Parses a Netscape Bookmarks HTML file and generates bookmarks.sql
 *
 * Usage: node scripts/import-bookmarks.mjs <path-to-bookmarks.html> [output.sql]
 */

import fs from "fs"
import path from "path"
import crypto from "crypto"

const inputFile = process.argv[2]
const outputFile = process.argv[3] ?? "bookmarks.sql"

if (!inputFile) {
  console.error("Usage: node scripts/import-bookmarks.mjs <Bookmarks.html> [output.sql]")
  process.exit(1)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uuid() {
  return crypto.randomUUID()
}

function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex")
}

function escape(str) {
  return (str ?? "").replace(/'/g, "''")
}

// Assign a color based on folder name hash
const COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
]
function colorFor(name) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return COLORS[Math.abs(h) % COLORS.length]
}

// Auto-generate tags from folder path + domain
function tagsFor(folderPath, url) {
  const tags = new Set()

  // Add each folder in the path as a tag (lowercased, spaces→hyphen)
  for (const part of folderPath) {
    const t = part.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-\u4e00-\u9fff]/g, "")
    if (t) tags.add(t)
  }

  // Add domain-based tag (strip www.)
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "")
    const domain = hostname.split(".").slice(0, -1).join(".")
    if (domain && domain !== "com" && domain.length > 1) tags.add(domain)
  } catch {}

  return [...tags]
}

// ─── Parse ────────────────────────────────────────────────────────────────────

const html = fs.readFileSync(inputFile, "utf-8")

// Tokenise: extract folder openings, folder closings, and links
const tokens = []
const patterns = [
  { type: "folder_open", re: /<DT><H3[^>]*>(.*?)<\/H3>/gi },
  { type: "folder_close", re: /<\/DL>/gi },
  { type: "link", re: /<DT><A\s+HREF="([^"]+)"[^>]*>(.*?)<\/A>/gi },
]

// Build a unified token stream sorted by position
for (const { type, re } of patterns) {
  let m
  while ((m = re.exec(html)) !== null) {
    tokens.push({ pos: m.index, type, match: m })
  }
}
tokens.sort((a, b) => a.pos - b.pos)

// Walk tokens to build folder tree and bookmarks list
const folderStack = []     // [{ id, name }]
const folders = []         // { id, parentId, name, sort }
const bookmarks = []       // { id, url, title, collectionId, folderPath }

let folderSort = 1
let bmSort = 1
const rootFolderIds = new Set()

for (const token of tokens) {
  if (token.type === "folder_open") {
    const name = token.match[1].replace(/<[^>]+>/g, "").trim()
    // Skip the synthetic root
    if (name === "Bookmarks" && folderStack.length === 0) continue
    const id = uuid()
    const parentId = folderStack.length > 0 ? folderStack[folderStack.length - 1].id : null
    folders.push({ id, parentId, name, sort: folderSort++ })
    if (!parentId) rootFolderIds.add(id)
    folderStack.push({ id, name })
  } else if (token.type === "folder_close") {
    if (folderStack.length > 0) folderStack.pop()
  } else if (token.type === "link") {
    const url = token.match[1].trim()
    const title = token.match[2].replace(/<[^>]+>/g, "").trim() || url
    if (!url.startsWith("http")) continue  // skip javascript: etc.
    const collectionId = folderStack.length > 0 ? folderStack[folderStack.length - 1].id : null
    const folderPath = folderStack.map((f) => f.name)
    bookmarks.push({ id: uuid(), url, title, collectionId, folderPath, sort: bmSort++ })
  }
}

console.log(`Parsed: ${folders.length} folders, ${bookmarks.length} bookmarks`)

// ─── Build tag maps ───────────────────────────────────────────────────────────

const tagMap = new Map()   // name → id

function getOrCreateTag(name) {
  if (!tagMap.has(name)) tagMap.set(name, uuid())
  return tagMap.get(name)
}

const bmTags = bookmarks.map((bm) => {
  const tags = tagsFor(bm.folderPath, bm.url)
  return { bmId: bm.id, tags: tags.map((t) => ({ name: t, tagId: getOrCreateTag(t) })) }
})

// ─── Generate SQL ─────────────────────────────────────────────────────────────

const now = new Date().toISOString()
const lines = []

lines.push(`-- Imported from Bookmarks.html`)
lines.push(`-- Generated: ${now}`)
lines.push(`-- ${folders.length} folders, ${bookmarks.length} bookmarks, ${tagMap.size} tags`)
lines.push(``)

// Collections
lines.push(`-- Collections`)
for (const f of folders) {
  lines.push(
    `INSERT OR IGNORE INTO collection (collection_id, parent_collection_id, name, color, sort, created_at, updated_at) VALUES ('${f.id}', ${f.parentId ? `'${f.parentId}'` : "NULL"}, '${escape(f.name)}', '${colorFor(f.name)}', ${f.sort}, '${now}', '${now}');`
  )
}
lines.push(``)

// Bookmarks
lines.push(`-- Bookmarks`)
for (const bm of bookmarks) {
  const hash = sha256(bm.url)
  const favicon = (() => {
    try { return `https://www.google.com/s2/favicons?domain=${new URL(bm.url).hostname}&sz=64` } catch { return null }
  })()
  lines.push(
    `INSERT OR IGNORE INTO bookmark (bookmark_id, collection_id, url, url_hash, title, favicon, sort, created_at, updated_at) VALUES ('${bm.id}', ${bm.collectionId ? `'${bm.collectionId}'` : "NULL"}, '${escape(bm.url)}', '${hash}', '${escape(bm.title)}', ${favicon ? `'${favicon}'` : "NULL"}, ${bm.sort}, '${now}', '${now}');`
  )
}
lines.push(``)

// Tags
lines.push(`-- Tags`)
for (const [name, id] of tagMap) {
  lines.push(
    `INSERT OR IGNORE INTO tag (tag_id, name, created_at, updated_at) VALUES ('${id}', '${escape(name)}', '${now}', '${now}');`
  )
}
lines.push(``)

// Bookmark-tag relations
lines.push(`-- Bookmark tags`)
for (const { bmId, tags } of bmTags) {
  for (const { tagId } of tags) {
    lines.push(
      `INSERT OR IGNORE INTO bookmark_tag (bookmark_id, tag_id, created_at) VALUES ('${bmId}', '${tagId}', '${now}');`
    )
  }
}
lines.push(``)

const sql = lines.join("\n")
fs.writeFileSync(outputFile, sql, "utf-8")
console.log(`✅ Written to ${outputFile}`)
console.log(`   ${folders.length} collections, ${bookmarks.length} bookmarks, ${tagMap.size} tags`)
