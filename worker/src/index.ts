import { handleCors, corsHeaders } from "./lib/cors"
import { json } from "./lib/response"
import { handleBookmarkQuery, handleBookmarkCreate, handleBookmarkUpdate, handleBookmarkDelete } from "./routes/bookmarks"
import { handleCollectionQuery, handleCollectionCreate, handleCollectionUpdate, handleCollectionDelete, handleCollectionList } from "./routes/collections"
import { handleTagQuery, handleTagList } from "./routes/tags"

export interface Env {
  DB: D1Database
  ALLOWED_ORIGIN: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigin = env.ALLOWED_ORIGIN ?? "http://localhost:3000"
    const origin = request.headers.get("Origin") ?? ""
    const isAllowed = origin === allowedOrigin || allowedOrigin === "*"
    const headers = corsHeaders(isAllowed ? origin : allowedOrigin)

    // Handle CORS preflight
    const corsResponse = handleCors(request, allowedOrigin)
    if (corsResponse) return corsResponse

    const url = new URL(request.url)
    const path = url.pathname

    switch (path) {
      case "/bookmark/query":      return handleBookmarkQuery(await request.json(), env, headers)
      case "/bookmark/create":     return handleBookmarkCreate(await request.json(), env, headers)
      case "/bookmark/update":     return handleBookmarkUpdate(await request.json(), env, headers)
      case "/bookmark/delete":     return handleBookmarkDelete(await request.json(), env, headers)
      case "/collection/query":    return handleCollectionQuery(await request.json(), env, headers)
      case "/collection/create":   return handleCollectionCreate(await request.json(), env, headers)
      case "/collection/update":   return handleCollectionUpdate(await request.json(), env, headers)
      case "/collection/delete":   return handleCollectionDelete(await request.json(), env, headers)
      case "/tag/query":           return handleTagQuery(await request.json(), env, headers)
      case "/collection/list":     return handleCollectionList(await request.json(), env, headers)
      case "/tag/list":            return handleTagList(await request.json(), env, headers)
      default:                     return json({ error: "Not found" }, 404, headers)
    }
  },
}
