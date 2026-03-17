"use client"

import * as React from "react"
import { IconBookmark, IconSearch } from "@tabler/icons-react"

import type { Bookmark, Collection } from "@/lib/types"
import { BookmarkCard } from "@/components/bookmark-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface BookmarkGridProps {
  bookmarks: Bookmark[]
  collections: Collection[]
  onEdit: (bookmark: Bookmark) => void
  onDelete: (id: string) => void
  onAdd?: () => void
  hasMore: boolean
  loadingMore: boolean
  loadMore: () => void
  total: number
  isFiltered?: boolean
}

export function BookmarkGrid({
  bookmarks,
  collections,
  onEdit,
  onDelete,
  onAdd,
  hasMore,
  loadingMore,
  loadMore,
  total,
  isFiltered = false,
}: BookmarkGridProps) {
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  const collectionMap = React.useMemo(
    () => new Map(collections.map((c) => [c.id, c])),
    [collections]
  )

  React.useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: "200px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="size-14 rounded-full bg-muted flex items-center justify-center">
          {isFiltered
            ? <IconSearch className="size-6 text-muted-foreground" />
            : <IconBookmark className="size-6 text-muted-foreground" />
          }
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">
            {isFiltered ? "No bookmarks match your search" : "No bookmarks yet"}
          </p>
          <p className="text-muted-foreground text-xs max-w-64">
            {isFiltered
              ? "Try different keywords or clear your filters."
              : "Save websites, articles, and links — all in one place."}
          </p>
        </div>
        {!isFiltered && onAdd && (
          <Button size="sm" onClick={onAdd}>
            Add your first bookmark
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 @sm/main:grid-cols-2 @lg/main:grid-cols-3 @2xl/main:grid-cols-4">
        {bookmarks.map((bookmark, i) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            collection={
              bookmark.collectionId
                ? collectionMap.get(bookmark.collectionId)
                : undefined
            }
            onEdit={onEdit}
            onDelete={onDelete}
            index={i}
          />
        ))}
        {loadingMore &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
      </div>

      <div ref={sentinelRef} className="h-4" style={{ overflowAnchor: "none" }} />

      <p className="text-center text-xs text-muted-foreground py-1">
        {bookmarks.length} / {total}
      </p>
    </div>
  )
}
