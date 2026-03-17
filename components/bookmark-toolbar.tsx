"use client"

import * as React from "react"
import { IconLayoutGrid, IconList, IconPlus, IconSearch } from "@tabler/icons-react"

import { useBookmarks } from "@/lib/bookmark-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

interface BookmarkToolbarProps {
  onAddBookmark: () => void
}

export function BookmarkToolbar({ onAddBookmark }: BookmarkToolbarProps) {
  const { state, dispatch } = useBookmarks()
  const [inputValue, setInputValue] = React.useState(state.search)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: "SET_SEARCH", search: inputValue })
    }, 300)
    return () => clearTimeout(timer)
  }, [inputValue, dispatch])

  return (
    <div className="flex items-center gap-2 px-4 lg:px-6">
      <div className="relative flex-1 max-w-sm">
        <label htmlFor="bookmark-search" className="sr-only">Search bookmarks</label>
        <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          id="bookmark-search"
          type="search"
          placeholder="Search bookmarks..."
          className="pl-9"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>

      <ToggleGroup
        type="single"
        value={state.viewMode}
        onValueChange={(v) =>
          v && dispatch({ type: "SET_VIEW_MODE", mode: v as "grid" | "table" })
        }
        variant="outline"
      >
        <ToggleGroupItem value="grid" aria-label="Grid view">
          <IconLayoutGrid className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="table" aria-label="Table view">
          <IconList className="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <Button onClick={onAddBookmark} size="sm" aria-label="Add bookmark">
        <IconPlus className="size-4" />
        <span className="hidden sm:inline">Add Bookmark</span>
      </Button>
    </div>
  )
}
