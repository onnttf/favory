import { json } from "../lib/response"

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
  bookmark_count: number
}

// POST /sidebar/data
// Returns all sidebar data in one call:
//   collections — full list; bookmarkCount includes all descendant collections
//   tags        — full list with global count
export async function handleSidebarData(
  _body: Record<string, unknown>,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const [colRes, tagRes] = await Promise.all([
    env.DB.prepare(
      `SELECT c.collection_id, c.parent_collection_id, c.name, c.color, c.sort, c.created_at, c.updated_at,
              (SELECT COUNT(*) FROM bookmark b WHERE b.collection_id = c.collection_id AND b.deleted_at IS NULL) AS bookmark_count
       FROM collection c WHERE c.deleted_at IS NULL ORDER BY c.sort ASC`
    ).all<CollectionRow>(),

    env.DB.prepare(
      `SELECT t.tag_id, t.name, COUNT(bt.bookmark_id) AS count
       FROM tag t
       INNER JOIN bookmark_tag bt ON bt.tag_id = t.tag_id AND bt.deleted_at IS NULL
       INNER JOIN bookmark b ON b.bookmark_id = bt.bookmark_id AND b.deleted_at IS NULL
       WHERE t.deleted_at IS NULL
       GROUP BY t.tag_id, t.name
       ORDER BY t.name`
    ).all<{ tag_id: string; name: string; count: number }>(),
  ])

  // Build children map for cumulative count computation
  const directCount: Record<string, number> = {}
  const childrenOf: Record<string, string[]> = {}
  for (const r of colRes.results) {
    directCount[r.collection_id] = r.bookmark_count
    if (r.parent_collection_id) {
      if (!childrenOf[r.parent_collection_id]) childrenOf[r.parent_collection_id] = []
      childrenOf[r.parent_collection_id].push(r.collection_id)
    }
  }

  function cumulativeCount(id: string): number {
    return (directCount[id] ?? 0) +
      (childrenOf[id] ?? []).reduce((sum, cid) => sum + cumulativeCount(cid), 0)
  }

  const collections = colRes.results.map((r) => ({
    id: r.collection_id,
    name: r.name,
    color: r.color,
    parentId: r.parent_collection_id ?? null,
    sort: r.sort,
    bookmarkCount: cumulativeCount(r.collection_id),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))

  const tags = tagRes.results.map((r) => ({
    id: r.tag_id,
    name: r.name,
    count: r.count,
  }))

  return json({ collections, tags }, 200, corsHeaders)
}
