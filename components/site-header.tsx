"use client"

import * as React from "react"

import type { Collection } from "@/lib/types"
import { useBookmarks } from "@/lib/bookmark-store"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

/** Walk up the parent chain to build an ordered path from root → leaf */
function buildCollectionPath(
  collectionId: string,
  collections: Collection[]
): Collection[] {
  const map = new Map(collections.map((c) => [c.id, c]))
  const path: Collection[] = []
  let current = map.get(collectionId)
  while (current) {
    path.unshift(current)
    current = current.parentId ? map.get(current.parentId) : undefined
  }
  return path
}

function CollectionDot({ color }: { color: string }) {
  return (
    <div
      aria-hidden="true"
      className="size-2 rounded-full shrink-0"
      style={{ backgroundColor: color }}
    />
  )
}

export function SiteHeader() {
  const { state, dispatch } = useBookmarks()

  const hasTags = state.tagFilters.length > 0
  const hasAnyFilter = !!state.collectionFilter || hasTags

  // Ordered from root → leaf, e.g. [Development, AI & ML]
  const collectionPath = React.useMemo(
    () =>
      state.collectionFilter
        ? buildCollectionPath(state.collectionFilter, state.collections)
        : [],
    [state.collectionFilter, state.collections]
  )

  const clearAll = React.useCallback(() => {
    dispatch({ type: "SET_COLLECTION_FILTER", collectionId: null })
    state.tagFilters.forEach((tag) => dispatch({ type: "TOGGLE_TAG_FILTER", tag }))
  }, [dispatch, state.tagFilters])

  const clearTags = React.useCallback(() => {
    state.tagFilters.forEach((tag) => dispatch({ type: "TOGGLE_TAG_FILTER", tag }))
  }, [dispatch, state.tagFilters])

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        <Breadcrumb>
          <BreadcrumbList>
            {/* Root: "All Bookmarks" */}
            <BreadcrumbItem>
              {hasAnyFilter ? (
                <BreadcrumbLink asChild>
                  <button onClick={clearAll}>All Bookmarks</button>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>All Bookmarks</BreadcrumbPage>
              )}
            </BreadcrumbItem>

            {/* Collection path: one segment per ancestor + leaf */}
            {collectionPath.map((col, i) => {
              const isLast = i === collectionPath.length - 1
              // Last collection segment is a page only when no tags follow
              const isCurrentPage = isLast && !hasTags

              return (
                <React.Fragment key={col.id}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isCurrentPage ? (
                      <BreadcrumbPage className="flex items-center gap-1.5">
                        <CollectionDot color={col.color} />
                        {col.name}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <button
                          onClick={() => {
                            if (isLast) {
                              // clicking the last collection while tags active → clear tags
                              clearTags()
                            } else {
                              // clicking an ancestor → navigate to that collection
                              dispatch({
                                type: "SET_COLLECTION_FILTER",
                                collectionId: col.id,
                              })
                            }
                          }}
                          className="flex items-center gap-1.5"
                        >
                          <CollectionDot color={col.color} />
                          {col.name}
                        </button>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}

            {/* Tags segment */}
            {hasTags && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {state.tagFilters.map((t) => `#${t}`).join(" · ")}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
