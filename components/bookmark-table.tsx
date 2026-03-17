"use client"

import * as React from "react"
import {
  IconBookmark,
  IconDotsVertical,
  IconExternalLink,
  IconSearch,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type RowData,
} from "@tanstack/react-table"

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string
  }
}

import type { Bookmark, Collection } from "@/lib/types"
import { getDomain } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CollectionBadge } from "@/components/collection-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"


interface BookmarkTableProps {
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

export function BookmarkTable({
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
}: BookmarkTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
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

  const columns: ColumnDef<Bookmark>[] = React.useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => {
          const b = row.original
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar size="sm" className="rounded">
                <AvatarImage src={b.favicon} alt="" loading="lazy" />
                <AvatarFallback className="rounded text-xs font-semibold text-white bg-muted-foreground/40">
                  {b.title.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:underline truncate max-w-50 block"
              >
                {b.title}
              </a>
            </div>
          )
        },
      },
      {
        accessorKey: "url",
        header: "URL",
        meta: { className: "hidden md:table-cell" },
        cell: ({ row }) => (
          <a
            href={row.original.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <span className="truncate max-w-40">
              {getDomain(row.original.url)}
            </span>
            <IconExternalLink className="size-3 shrink-0" />
          </a>
        ),
      },
      {
        accessorKey: "collectionId",
        header: "Collection",
        cell: ({ row }) => {
          const col = row.original.collectionId
            ? collectionMap.get(row.original.collectionId)
            : null
          if (!col)
            return <span className="text-muted-foreground text-xs">—</span>
          return <CollectionBadge name={col.name} color={col.color} />
        },
      },
      {
        accessorKey: "tags",
        header: "Tags",
        meta: { className: "hidden md:table-cell" },
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {row.original.tags.length > 2 && (
              <Badge
                variant="outline"
                className="text-xs"
                aria-label={`${row.original.tags.length - 2} more tags`}
              >
                +{row.original.tags.length - 2}
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Added",
        meta: { className: "hidden lg:table-cell" },
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex size-11 text-muted-foreground data-[state=open]:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                size="icon"
              >
                <IconDotsVertical />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={row.original.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open link
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(row.original.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [collectionMap, onEdit, onDelete]
  )

  const table = useReactTable({
    data: bookmarks,
    columns,
    state: { sorting },
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const visibleRows = table.getRowModel().rows

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
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={header.column.columnDef.meta?.className}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cell.column.columnDef.meta?.className}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {loadingMore &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-6 rounded shrink-0" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="size-8 rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div ref={sentinelRef} className="h-4" style={{ overflowAnchor: "none" }} />

      <p className="text-center text-xs text-muted-foreground py-1">
        {bookmarks.length} / {total}
      </p>
    </div>
  )
}
