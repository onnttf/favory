import { json, notFound, badRequest } from "../lib/response"

export interface Env {
  DB: D1Database
  ALLOWED_ORIGIN: string
}

interface CollectionRow {
  collection_id: string
  parent_collection_id: string | null
  name: string
  color: string
  sort: number
  created_at: string
  updated_at: string
}

function rowToCollection(r: CollectionRow) {
  return {
    id: r.collection_id,
    name: r.name,
    color: r.color,
    parentId: r.parent_collection_id ?? null,
    sort: r.sort,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

// POST /collection/query
export async function handleCollectionQuery(
  _body: Record<string, unknown>,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT c.collection_id, c.parent_collection_id, c.name, c.color, c.sort, c.created_at, c.updated_at,
            (SELECT COUNT(*) FROM bookmark b WHERE b.collection_id = c.collection_id AND b.deleted_at IS NULL) AS bookmark_count
     FROM collection c WHERE c.deleted_at IS NULL ORDER BY c.sort ASC`
  ).all<CollectionRow & { bookmark_count: number }>()

  const data = results.map((r) => ({ ...rowToCollection(r), bookmarkCount: r.bookmark_count }))
  return json({ data, total: results.length }, 200, corsHeaders)
}

// POST /collection/create
export async function handleCollectionCreate(
  body: Record<string, unknown>,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const color = typeof body.color === "string" ? body.color : "#ffffff"
  const parentId = typeof body.parentId === "string" ? body.parentId : null

  if (!name) return badRequest({ name: ["Name is required"] }, corsHeaders)

  const collectionId = crypto.randomUUID()
  const now = new Date().toISOString()

  const sortRow = await env.DB.prepare(
    `SELECT COALESCE(MAX(sort), 0) + 1 AS next_sort FROM collection WHERE deleted_at IS NULL`
  ).first<{ next_sort: number }>()
  const sort = sortRow?.next_sort ?? 1

  await env.DB.prepare(
    `INSERT INTO collection (collection_id, parent_collection_id, name, color, sort, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(collectionId, parentId, name, color, sort, now, now).run()

  return json(
    { id: collectionId, name, color, parentId, sort, createdAt: now, updatedAt: now },
    201,
    corsHeaders
  )
}

// POST /collection/update
export async function handleCollectionUpdate(
  body: Record<string, unknown>,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const id = typeof body.id === "string" ? body.id : ""
  if (!id) return badRequest({ id: ["ID is required"] }, corsHeaders)

  const row = await env.DB.prepare(
    `SELECT collection_id, parent_collection_id, name, color, sort, created_at, updated_at
     FROM collection WHERE collection_id = ? AND deleted_at IS NULL`
  ).first<CollectionRow>(id)

  if (!row) return notFound(corsHeaders)

  const name = typeof body.name === "string" ? body.name.trim() : row.name
  const color = typeof body.color === "string" ? body.color : row.color
  const parentId = "parentId" in body
    ? (body.parentId === null ? null : String(body.parentId))
    : row.parent_collection_id
  const now = new Date().toISOString()

  await env.DB.prepare(
    `UPDATE collection SET name = ?, color = ?, parent_collection_id = ?, updated_at = ?
     WHERE collection_id = ?`
  ).bind(name, color, parentId, now, id).run()

  return json(rowToCollection({ ...row, name, color, parent_collection_id: parentId, updated_at: now }), 200, corsHeaders)
}

// POST /collection/delete
export async function handleCollectionDelete(
  body: Record<string, unknown>,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const id = typeof body.id === "string" ? body.id : ""
  if (!id) return badRequest({ id: ["ID is required"] }, corsHeaders)

  const row = await env.DB.prepare(
    `SELECT collection_id, parent_collection_id FROM collection WHERE collection_id = ? AND deleted_at IS NULL`
  ).bind(id).first<{ collection_id: string; parent_collection_id: string | null }>()

  if (!row) return notFound(corsHeaders)

  const now = new Date().toISOString()
  const parentId = row.parent_collection_id  // null if root-level

  try {
    // Promote direct children to this collection's parent (or root if no parent)
    await env.DB.prepare(
      `UPDATE collection SET parent_collection_id = ?, updated_at = ? WHERE parent_collection_id = ? AND deleted_at IS NULL`
    ).bind(parentId, now, id).run()

    // Unlink bookmarks that were directly in this collection
    await env.DB.prepare(
      `UPDATE bookmark SET collection_id = NULL, updated_at = ? WHERE collection_id = ? AND deleted_at IS NULL`
    ).bind(now, id).run()

    // Soft-delete only this collection
    await env.DB.prepare(
      `UPDATE collection SET deleted_at = ? WHERE collection_id = ?`
    ).bind(now, id).run()

    return json({ success: true, parentId }, 200, corsHeaders)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return json({ error: msg }, 500, corsHeaders)
  }
}

