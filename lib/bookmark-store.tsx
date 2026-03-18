"use client"

import * as React from "react"
import type { Bookmark, Collection, Tag } from "./types"

export const WORKER_URL = (process.env.NEXT_PUBLIC_WORKER_URL ?? "").replace(/\/$/, "")

const PAGE_SIZE = 20

const post = (path: string, body: Record<string, unknown> = {}) =>
  fetch(`${WORKER_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json())

// Refresh collections and tags after CRUD operations
export async function refreshCollections(dispatch: React.Dispatch<Action>, collectionId?: string | null) {
  const [colRes, tagRes] = await Promise.all([
    post("/collection/list", {}),
    post("/tag/list", { collectionId: collectionId || undefined }),
  ])
  dispatch({ type: "REFRESH_COLLECTIONS", collections: colRes.collections })
  dispatch({ type: "UPDATE_TAGS", tags: tagRes.tags })
}

// ─── State ────────────────────────────────────────────────────────────────────

interface BookmarkState {
  bookmarks: Bookmark[]
  collections: Collection[]
  tags: Tag[]
  search: string
  collectionFilter: string | null
  tagFilters: string[]
  viewMode: "grid" | "table"
  loading: boolean
  loadingMore: boolean
  page: number
  total: number        // filtered total (current query)
  globalTotal: number  // unfiltered total (all bookmarks)
}

const initialState: BookmarkState = {
  bookmarks: [],
  collections: [],
  tags: [],
  search: "",
  collectionFilter: null,
  tagFilters: [],
  viewMode: "grid",
  loading: true,
  loadingMore: false,
  page: 1,
  total: 0,
  globalTotal: 0,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Returns the collection ID and all its ancestor IDs (for propagating bookmark counts)
function ancestorChain(collectionId: string | null, collections: Collection[]): string[] {
  const ids: string[] = []
  let curr = collectionId ? collections.find((c) => c.id === collectionId) ?? null : null
  while (curr) {
    ids.push(curr.id)
    curr = curr.parentId ? collections.find((c) => c.id === curr!.parentId) ?? null : null
  }
  return ids
}

function applyTagDelta(tags: Tag[], tagNames: string[], delta: 1 | -1): Tag[] {
  let updated = tags.map((t) =>
    tagNames.includes(t.name) ? { ...t, count: Math.max(0, t.count + delta) } : t
  )
  if (delta === 1) {
    const existing = new Set(tags.map((t) => t.name))
    for (const name of tagNames) {
      if (!existing.has(name)) {
        updated = [...updated, { id: `local-${name}`, name, count: 1 }]
      }
    }
    updated.sort((a, b) => a.name.localeCompare(b.name))
  } else {
    updated = updated.filter((t) => t.count > 0)
  }
  return updated
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "INIT_DONE"; bookmarks: Bookmark[]; collections: Collection[]; tags: Tag[]; total: number; globalTotal: number }
  | { type: "RESET_BOOKMARKS"; bookmarks: Bookmark[]; total: number }
  | { type: "APPEND_BOOKMARKS"; bookmarks: Bookmark[]; page: number }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_LOADING_MORE"; value: boolean }
  | { type: "ADD_BOOKMARK"; bookmark: Bookmark }
  | { type: "UPDATE_BOOKMARK"; bookmark: Bookmark }
  | { type: "DELETE_BOOKMARK"; id: string }
  | { type: "ADD_COLLECTION"; collection: Collection }
  | { type: "UPDATE_COLLECTION"; collection: Collection }
  | { type: "DELETE_COLLECTION"; id: string; parentId: string | null }
  | { type: "SET_SEARCH"; search: string }
  | { type: "SET_COLLECTION_FILTER"; collectionId: string | null }
  | { type: "TOGGLE_TAG_FILTER"; tag: string }
  | { type: "SET_VIEW_MODE"; mode: "grid" | "table" }
  | { type: "UPDATE_TAGS"; tags: Tag[] }
  | { type: "REFRESH_COLLECTIONS"; collections: Collection[] }

function reducer(state: BookmarkState, action: Action): BookmarkState {
  switch (action.type) {
    case "INIT_DONE":
      return {
        ...state,
        bookmarks: action.bookmarks,
        collections: action.collections,
        tags: action.tags,
        total: action.total,
        globalTotal: action.globalTotal,
        page: 1,
        loading: false,
        loadingMore: false,
      }
    case "RESET_BOOKMARKS":
      return { ...state, bookmarks: action.bookmarks, total: action.total, page: 1, loading: false, loadingMore: false }
    case "APPEND_BOOKMARKS":
      return { ...state, bookmarks: [...state.bookmarks, ...action.bookmarks], page: action.page, loadingMore: false }
    case "SET_LOADING":
      return { ...state, loading: action.value }
    case "SET_LOADING_MORE":
      return { ...state, loadingMore: action.value }

    case "ADD_BOOKMARK": {
      const b = action.bookmark
      const toInc = new Set(ancestorChain(b.collectionId, state.collections))
      return {
        ...state,
        bookmarks: [...state.bookmarks, b],
        total: state.total + 1,
        globalTotal: state.globalTotal + 1,
        collections: state.collections.map((c) =>
          toInc.has(c.id) ? { ...c, bookmarkCount: c.bookmarkCount + 1 } : c
        ),
        tags: applyTagDelta(state.tags, b.tags, 1),
      }
    }
    case "UPDATE_BOOKMARK": {
      const prev = state.bookmarks.find((b) => b.id === action.bookmark.id)
      const next = action.bookmark
      let collections = state.collections
      let tags = state.tags
      if (prev && prev.collectionId !== next.collectionId) {
        const toDec = new Set(ancestorChain(prev.collectionId, collections))
        const toInc = new Set(ancestorChain(next.collectionId, collections))
        collections = collections.map((c) => {
          if (toDec.has(c.id) && !toInc.has(c.id)) return { ...c, bookmarkCount: Math.max(0, c.bookmarkCount - 1) }
          if (toInc.has(c.id) && !toDec.has(c.id)) return { ...c, bookmarkCount: c.bookmarkCount + 1 }
          return c
        })
      }
      if (prev) {
        const removed = prev.tags.filter((t) => !next.tags.includes(t))
        const added = next.tags.filter((t) => !prev.tags.includes(t))
        if (removed.length) tags = applyTagDelta(tags, removed, -1)
        if (added.length) tags = applyTagDelta(tags, added, 1)
      }
      return {
        ...state,
        bookmarks: state.bookmarks.map((b) => b.id === next.id ? next : b),
        collections,
        tags,
      }
    }
    case "DELETE_BOOKMARK": {
      const b = state.bookmarks.find((bm) => bm.id === action.id)
      const toDec = new Set(ancestorChain(b?.collectionId ?? null, state.collections))
      return {
        ...state,
        bookmarks: state.bookmarks.filter((bm) => bm.id !== action.id),
        total: Math.max(0, state.total - 1),
        globalTotal: Math.max(0, state.globalTotal - 1),
        collections: toDec.size > 0
          ? state.collections.map((c) =>
              toDec.has(c.id) ? { ...c, bookmarkCount: Math.max(0, c.bookmarkCount - 1) } : c
            )
          : state.collections,
        tags: b ? applyTagDelta(state.tags, b.tags, -1) : state.tags,
      }
    }

    case "ADD_COLLECTION":
      return { ...state, collections: [...state.collections, action.collection] }
    case "UPDATE_COLLECTION":
      return {
        ...state,
        collections: state.collections.map((c) =>
          c.id === action.collection.id ? { ...c, ...action.collection } : c
        ),
      }
    case "DELETE_COLLECTION":
      return {
        ...state,
        // Remove the deleted collection; promote its direct children to its parent
        collections: state.collections
          .filter((c) => c.id !== action.id)
          .map((c) => c.parentId === action.id ? { ...c, parentId: action.parentId } : c),
        // Unlink bookmarks that were directly in this collection
        bookmarks: state.bookmarks.map((b) =>
          b.collectionId === action.id ? { ...b, collectionId: null } : b
        ),
        collectionFilter: state.collectionFilter === action.id ? null : state.collectionFilter,
      }
    case "SET_SEARCH":
      return { ...state, search: action.search }
    case "SET_COLLECTION_FILTER":
      return { ...state, collectionFilter: action.collectionId, tagFilters: [] }
    case "TOGGLE_TAG_FILTER":
      return {
        ...state,
        tagFilters: state.tagFilters.includes(action.tag)
          ? state.tagFilters.filter((t) => t !== action.tag)
          : [...state.tagFilters, action.tag],
      }
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.mode }
    case "UPDATE_TAGS":
      return { ...state, tags: action.tags }
    case "REFRESH_COLLECTIONS":
      return { ...state, collections: action.collections }
    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface BookmarkContextValue {
  state: BookmarkState
  dispatch: React.Dispatch<Action>
  allTags: string[]
  bookmarkCounts: Record<string, number>
  tagCounts: Record<string, number>
  globalTotal: number
  hasMore: boolean
  loadMore: () => void
}

const BookmarkContext = React.createContext<BookmarkContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, initialState)

  const searchRef = React.useRef(state.search)
  const collectionFilterRef = React.useRef(state.collectionFilter)
  const tagFiltersRef = React.useRef(state.tagFilters)
  const stateRef = React.useRef(state)
  React.useEffect(() => { searchRef.current = state.search }, [state.search])
  React.useEffect(() => { collectionFilterRef.current = state.collectionFilter }, [state.collectionFilter])
  React.useEffect(() => { tagFiltersRef.current = state.tagFilters }, [state.tagFilters])
  React.useEffect(() => { stateRef.current = state })

  const initializedRef = React.useRef(false)

  // Initial load
  React.useEffect(() => {
    Promise.all([
      post("/bookmark/query", { page: 1, pageSize: PAGE_SIZE }),
      post("/collection/list", {}),
      post("/tag/list", {}),
    ]).then(([bmRes, colRes, tagRes]) => {
      dispatch({
        type: "INIT_DONE",
        bookmarks: bmRes.data,
        collections: colRes.collections,
        tags: tagRes.tags,
        total: bmRes.total,
        globalTotal: bmRes.total,
      })
      initializedRef.current = true
    })
  }, [])

  // Re-fetch bookmarks whenever any filter changes.
  // Single effect so that when SET_COLLECTION_FILTER clears tagFilters in the same
  // dispatch, both changes are seen at once and only one request fires.
  React.useEffect(() => {
    if (!initializedRef.current) return
    dispatch({ type: "SET_LOADING", value: true })
    post("/bookmark/query", {
      q: state.search || undefined,
      collectionId: state.collectionFilter || undefined,
      tags: state.tagFilters.length ? state.tagFilters : undefined,
      page: 1,
      pageSize: PAGE_SIZE,
    }).then((res) => {
      dispatch({ type: "RESET_BOOKMARKS", bookmarks: res.data, total: res.total })
    })
  }, [state.search, state.collectionFilter, state.tagFilters])  

  // Refresh tags when collection filter changes
  React.useEffect(() => {
    if (!initializedRef.current) return
    post("/tag/list", { collectionId: state.collectionFilter || undefined }).then((res) => {
      dispatch({ type: "UPDATE_TAGS", tags: res.tags })
    })
  }, [state.collectionFilter])

  // Load next page - only trigger when not already loading
  const loadMore = React.useCallback(() => {
    const s = stateRef.current
    // Prevent if: no more data, already loading
    if (s.bookmarks.length >= s.total || s.loadingMore) return
    dispatch({ type: "SET_LOADING_MORE", value: true })
    const nextPage = s.page + 1
    post("/bookmark/query", {
      q: searchRef.current || undefined,
      collectionId: collectionFilterRef.current || undefined,
      tags: tagFiltersRef.current.length ? tagFiltersRef.current : undefined,
      page: nextPage,
      pageSize: PAGE_SIZE,
    }).then((res) => {
      if (res.data && res.data.length > 0) {
        dispatch({ type: "APPEND_BOOKMARKS", bookmarks: res.data, page: nextPage })
      } else {
        dispatch({ type: "SET_LOADING_MORE", value: false })
      }
    }).catch(() => {
      dispatch({ type: "SET_LOADING_MORE", value: false })
    })
  }, [])

  const hasMore = state.bookmarks.length < state.total

  const allTags = React.useMemo(() => state.tags.map((t) => t.name), [state.tags])

  const bookmarkCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    state.collections.forEach((c) => { counts[c.id] = c.bookmarkCount })
    return counts
  }, [state.collections])

  const tagCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    state.tags.forEach((t) => { counts[t.name] = t.count })
    return counts
  }, [state.tags])

  const value = React.useMemo(
    () => ({ state, dispatch, allTags, bookmarkCounts, tagCounts, globalTotal: state.globalTotal, hasMore, loadMore }),
    [state, allTags, bookmarkCounts, tagCounts, hasMore, loadMore]
  )

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  )
}

export function useBookmarks() {
  const ctx = React.useContext(BookmarkContext)
  if (!ctx) throw new Error("useBookmarks must be used within BookmarkProvider")
  return ctx
}
