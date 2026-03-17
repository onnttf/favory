import { json, notFound, badRequest } from "../lib/response"

export interface Env {
  DB: D1Database
  ALLOWED_ORIGIN: string
}

interface BookmarkRow {
  bookmark_id: string
  collection_id: string | null
  url: string
  url_hash: string
  title: string
  description: string | null
  favicon: string | null
  sort: number
  created_at: string
  updated_at: string
}

async function getTagsForBookmarks(
  db: D1Database,
  bookmarkIds: string[]
): Promise<Record<string, string[]>> {
  if (bookmarkIds.length === 0) return {}

  const placeholders = bookmarkIds.map(() => "?").join(",")
  const { results } = await db.prepare(
    `SELECT bt.bookmark_id, t.name
     FROM bookmark_tag bt
     INNER JOIN tag t ON t.tag_id = bt.tag_id AND t.deleted_at IS NULL
     WHERE bt.bookmark_id IN (${placeholders}) AND bt.deleted_at IS NULL`
  ).bind(...bookmarkIds).all<{ bookmark_id: string; name: string }>()

  const map: Record<string, string[]> = {}
  for (const r of results) {
    if (!map[r.bookmark_id]) map[r.bookmark_id] = []
    map[r.bookmark_id].push(r.name)
  }
  return map
}

function rowToBookmark(r: BookmarkRow, tags: string[]) {
  return {
    id: r.bookmark_id,
    url: r.url,
    title: r.title,
    description: r.description ?? undefined,
    tags,
    collectionId: r.collection_id ?? null,
    favicon: r.favicon ?? undefined,
    sort: r.sort,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

async function hashUrl(url: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(url)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function upsertTags(db: D1Database, tagNames: string[]): Promise<string[]> {
  const tagIds: string[] = []
  for (const name of tagNames) {
    const trimmed = name.trim()
    if (!trimmed) continue

    const existing = await db.prepare(
      `SELECT tag_id FROM tag WHERE name = ? AND deleted_at IS NULL`
    ).bind(trimmed).first<{ tag_id: string }>()

    if (existing) {
      tagIds.push(existing.tag_id)
    } else {
      const tagId = crypto.randomUUID()
      const now = new Date().toISOString()
      await db.prepare(
        `INSERT INTO tag (tag_id, name, created_at, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(name) DO UPDATE SET deleted_at = NULL, updated_at = excluded.updated_at`
      ).bind(tagId, trimmed, now, now).run()

      const created = await db.prepare(
        `SELECT tag_id FROM tag WHERE name = ? AND deleted_at IS NULL`
      ).bind(trimmed).first<{ tag_id: string }>()
      if (created) tagIds.push(created.tag_id)
    }
  }
  return tagIds
}

async function syncBookmarkTags(
  db: D1Database,
  bookmarkId: string,
  tagIds: string[]
): Promise<void> {
  const now = new Date().toISOString()

  await db.prepare(
    `UPDATE bookmark_tag SET deleted_at = ? WHERE bookmark_id = ? AND deleted_at IS NULL`
  ).bind(now, bookmarkId).run()

  for (const tagId of tagIds) {
    await db.prepare(
      `INSERT INTO bookmark_tag (bookmark_id, tag_id, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(bookmark_id, tag_id) DO UPDATE SET deleted_at = NULL`
    ).bind(bookmarkId, tagId, now).run()
  }
}

// POST /bookmark/query
// Body: { q?, collectionId?, tags?: string[], page?, pageSize? }
// All filters are applied server-side; total reflects the full matching count.
export async function handleBookmarkQuery(
  body: Record<string, unknown>,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const q = typeof body.q === "string" ? body.q.toLowerCase() : undefined
  const collectionId = typeof body.collectionId === "string" ? body.collectionId : undefined
  const tags = Array.isArray(body.tags)
    ? (body.tags as unknown[]).filter((t): t is string => typeof t === "string")
    : []
  const page = typeof body.page === "number" && body.page > 0 ? Math.floor(body.page) : 1
  const pageSize = typeof body.pageSize === "number" && body.pageSize > 0
    ? Math.min(Math.floor(body.pageSize), 200)
    : 20

  // When a collection is selected, include bookmarks from all descendant collections too
  const cte = collectionId
    ? `WITH RECURSIVE col_tree(collection_id) AS (
         SELECT collection_id FROM collection WHERE collection_id = ? AND deleted_at IS NULL
         UNION ALL
         SELECT c.collection_id FROM collection c
         INNER JOIN col_tree ct ON c.parent_collection_id = ct.collection_id
         WHERE c.deleted_at IS NULL
       ) `
    : ""
  const cteParams: string[] = collectionId ? [collectionId] : []

  const whereParts: string[] = ["b.deleted_at IS NULL"]
  const filterParams: string[] = []

  if (collectionId) {
    whereParts.push("b.collection_id IN (SELECT collection_id FROM col_tree)")
  }
  if (q) {
    whereParts.push(
      "(LOWER(b.title) LIKE ? OR LOWER(b.url) LIKE ? OR LOWER(COALESCE(b.description,'')) LIKE ?)"
    )
    filterParams.push(`%${q}%`, `%${q}%`, `%${q}%`)
  }
  for (const tag of tags) {
    whereParts.push(
      `EXISTS (
         SELECT 1 FROM bookmark_tag bt_f
         INNER JOIN tag t_f ON t_f.tag_id = bt_f.tag_id AND t_f.deleted_at IS NULL
         WHERE bt_f.bookmark_id = b.bookmark_id AND bt_f.deleted_at IS NULL AND t_f.name = ?
       )`
    )
    filterParams.push(tag)
  }

  const where = whereParts.join(" AND ")
  const params = [...cteParams, ...filterParams]

  const [countRow, { results }] = await Promise.all([
    env.DB.prepare(`${cte}SELECT COUNT(*) AS total FROM bookmark b WHERE ${where}`)
      .bind(...params)
      .first<{ total: number }>(),
    env.DB.prepare(
      `${cte}SELECT b.bookmark_id, b.collection_id, b.url, b.url_hash, b.title, b.description, b.favicon, b.sort, b.created_at, b.updated_at
       FROM bookmark b WHERE ${where}
       ORDER BY b.sort ASC, b.created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...params, pageSize, (page - 1) * pageSize)
      .all<BookmarkRow>(),
  ])

  const tagsMap = await getTagsForBookmarks(env.DB, results.map((r) => r.bookmark_id))
  const data = results.map((r) => rowToBookmark(r, tagsMap[r.bookmark_id] ?? []))

  return json({ data, total: countRow?.total ?? 0 }, 200, corsHeaders)
}

// POST /bookmark/create
export async function handleBookmarkCreate(
  body: Record<string, unknown>,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const bUrl = typeof body.url === "string" ? body.url.trim() : ""
  const title = typeof body.title === "string" ? body.title.trim() : ""

  if (!bUrl) return badRequest({ url: ["URL is required"] }, corsHeaders)
  if (!title) return badRequest({ title: ["Title is required"] }, corsHeaders)

  try { new URL(bUrl) } catch {
    return badRequest({ url: ["Invalid URL"] }, corsHeaders)
  }

  const description = typeof body.description === "string" ? body.description : null
  const favicon = typeof body.favicon === "string" ? body.favicon : null
  const collectionId = typeof body.collectionId === "string" ? body.collectionId : null
  const tagNames = Array.isArray(body.tags)
    ? (body.tags as unknown[]).filter((t): t is string => typeof t === "string")
    : []

  const urlHash = await hashUrl(bUrl)
  const bookmarkId = crypto.randomUUID()
  const now = new Date().toISOString()

  const sortRow = await env.DB.prepare(
    `SELECT COALESCE(MAX(sort), 0) + 1 AS next_sort FROM bookmark WHERE deleted_at IS NULL`
  ).first<{ next_sort: number }>()
  const sort = sortRow?.next_sort ?? 1

  try {
    await env.DB.prepare(
      `INSERT INTO bookmark (bookmark_id, collection_id, url, url_hash, title, description, favicon, sort, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(bookmarkId, collectionId, bUrl, urlHash, title, description, favicon, sort, now, now).run()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("UNIQUE")) {
      return badRequest({ url: ["URL already exists"] }, corsHeaders)
    }
    throw e
  }

  const tagIds = await upsertTags(env.DB, tagNames)
  await syncBookmarkTags(env.DB, bookmarkId, tagIds)

  return json(
    rowToBookmark(
      { bookmark_id: bookmarkId, collection_id: collectionId, url: bUrl, url_hash: urlHash, title, description, favicon, sort, created_at: now, updated_at: now },
      tagNames
    ),
    201,
    corsHeaders
  )
}

// POST /bookmark/update
export async function handleBookmarkUpdate(
  body: Record<string, unknown>,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const id = typeof body.id === "string" ? body.id : ""
  if (!id) return badRequest({ id: ["ID is required"] }, corsHeaders)

  const row = await env.DB.prepare(
    `SELECT bookmark_id, collection_id, url, url_hash, title, description, favicon, sort, created_at, updated_at
     FROM bookmark WHERE bookmark_id = ? AND deleted_at IS NULL`
  ).bind(id).first<BookmarkRow>()

  if (!row) return notFound(corsHeaders)

  const newUrl = typeof body.url === "string" ? body.url.trim() : row.url
  const title = typeof body.title === "string" ? body.title.trim() : row.title
  const description = "description" in body
    ? (typeof body.description === "string" ? body.description : null)
    : row.description
  const favicon = "favicon" in body
    ? (typeof body.favicon === "string" ? body.favicon : null)
    : row.favicon
  const collectionId = "collectionId" in body
    ? (body.collectionId === null ? null : typeof body.collectionId === "string" ? body.collectionId : row.collection_id)
    : row.collection_id
  const tagNames = Array.isArray(body.tags)
    ? (body.tags as unknown[]).filter((t): t is string => typeof t === "string")
    : null

  if (newUrl !== row.url) {
    try { new URL(newUrl) } catch {
      return badRequest({ url: ["Invalid URL"] }, corsHeaders)
    }
  }

  const urlHash = newUrl !== row.url ? await hashUrl(newUrl) : row.url_hash
  const now = new Date().toISOString()

  try {
    await env.DB.prepare(
      `UPDATE bookmark SET url = ?, url_hash = ?, title = ?, description = ?, favicon = ?, collection_id = ?, updated_at = ?
       WHERE bookmark_id = ?`
    ).bind(newUrl, urlHash, title, description, favicon, collectionId, now, id).run()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("UNIQUE")) {
      return badRequest({ url: ["A bookmark with this URL already exists"] }, corsHeaders)
    }
    throw e
  }

  if (tagNames !== null) {
    const tagIds = await upsertTags(env.DB, tagNames)
    await syncBookmarkTags(env.DB, id, tagIds)
  }

  const finalTags = tagNames !== null
    ? tagNames
    : (await getTagsForBookmarks(env.DB, [id]))[id] ?? []

  return json(
    rowToBookmark(
      { ...row, url: newUrl, url_hash: urlHash, title, description, favicon, collection_id: collectionId, updated_at: now },
      finalTags
    ),
    200,
    corsHeaders
  )
}

// POST /bookmark/delete
export async function handleBookmarkDelete(
  body: Record<string, unknown>,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const id = typeof body.id === "string" ? body.id : ""
  if (!id) return badRequest({ id: ["ID is required"] }, corsHeaders)

  const row = await env.DB.prepare(
    `SELECT bookmark_id FROM bookmark WHERE bookmark_id = ? AND deleted_at IS NULL`
  ).bind(id).first()

  if (!row) return notFound(corsHeaders)

  const now = new Date().toISOString()
  await env.DB.prepare(
    `UPDATE bookmark SET deleted_at = ? WHERE bookmark_id = ?`
  ).bind(now, id).run()

  await env.DB.prepare(
    `UPDATE bookmark_tag SET deleted_at = ? WHERE bookmark_id = ? AND deleted_at IS NULL`
  ).bind(now, id).run()

  return json({ success: true }, 200, corsHeaders)
}

