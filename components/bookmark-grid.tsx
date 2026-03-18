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
  const collectionMap = React.useMemo(
    () => new Map(collections.map((c) => [c.id, c])),
    [collections]
  )

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
          {isFiltered
            ? <IconSearch className="size-6 text-primary" />
            : <IconBookmark className="size-6 text-primary" />
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
    <div>
      <div
        className="grid grid-cols-1 gap-3 p-3 -m-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 400px' }}
      >
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
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
      </div>
    </div>
  )
}
