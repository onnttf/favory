import { json } from "../lib/response"

export interface Env {
  DB: D1Database
  ALLOWED_ORIGIN: string
}

// POST /tag/query
// Body: { collectionId? } — when provided, returns only tags used within that collection
export async function handleTagQuery(
  body: Record<string, unknown>,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const collectionId = typeof body.collectionId === "string" ? body.collectionId : undefined

  let query: string
  let params: string[]

  if (collectionId) {
    query = `SELECT t.tag_id, t.name, COUNT(bt.bookmark_id) AS count
             FROM tag t
             INNER JOIN bookmark_tag bt ON bt.tag_id = t.tag_id AND bt.deleted_at IS NULL
             INNER JOIN bookmark b ON b.bookmark_id = bt.bookmark_id AND b.deleted_at IS NULL
                        AND b.collection_id = ?
             WHERE t.deleted_at IS NULL
             GROUP BY t.tag_id, t.name
             ORDER BY t.name`
    params = [collectionId]
  } else {
    query = `SELECT t.tag_id, t.name, COUNT(bt.bookmark_id) AS count
             FROM tag t
             INNER JOIN bookmark_tag bt ON bt.tag_id = t.tag_id AND bt.deleted_at IS NULL
             INNER JOIN bookmark b ON b.bookmark_id = bt.bookmark_id AND b.deleted_at IS NULL
             WHERE t.deleted_at IS NULL
             GROUP BY t.tag_id, t.name
             ORDER BY t.name`
    params = []
  }

  const { results } = await env.DB.prepare(query).bind(...params)
    .all<{ tag_id: string; name: string; count: number }>()

  const tags = results.map((r) => ({ id: r.tag_id, name: r.name, count: r.count }))
  return json({ data: tags, total: tags.length }, 200, corsHeaders)
}
