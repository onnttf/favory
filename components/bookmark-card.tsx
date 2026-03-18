"use client"

import * as React from "react"
import { IconExternalLink, IconPencil, IconTrash } from "@tabler/icons-react"

import type { Bookmark, Collection } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CollectionBadge } from "@/components/collection-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"

interface BookmarkCardProps {
  bookmark: Bookmark
  collection?: Collection
  onEdit: (bookmark: Bookmark) => void
  onDelete: (id: string) => void
  index?: number
}


export const BookmarkCard = React.memo(function BookmarkCard({
  bookmark,
  collection,
  onEdit,
  onDelete,
  index = 0,
}: BookmarkCardProps) {
  return (
    <Card
      size="sm"
      className="group relative flex flex-col transition-[box-shadow,border-color] duration-200 ease-out hover:shadow-md hover:border-primary/30 animate-[card-enter_0.3s_ease-out_forwards]"
      style={{ animationDelay: `${Math.min(index * 50, 400)}ms`, opacity: 0 }}
    >
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Avatar className="size-6 shrink-0">
          <AvatarImage src={bookmark.favicon}  loading="lazy" />
          <AvatarFallback
            className="text-white text-xs font-semibold"
            style={{ backgroundColor: collection?.color ?? "hsl(var(--muted-foreground) / 0.4)" }}
          >
            {bookmark.title.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-1 font-medium text-foreground hover:underline focus-visible:underline focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none rounded-sm"
          >
            {bookmark.title}
          </a>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(pointer:coarse)]:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 hover:bg-accent/80 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => onEdit(bookmark)}
          >
            <IconPencil className="size-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 text-destructive hover:bg-destructive/10 focus-visible:ring-[3px] focus-visible:ring-destructive focus-visible:ring-offset-2"
            onClick={() => onDelete(bookmark.id)}
          >
            <IconTrash className="size-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </CardHeader>

      {bookmark.description && (
        <CardContent className="pb-2 pt-0">
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {bookmark.description}
          </p>
        </CardContent>
      )}

      <CardFooter className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
        {collection && (
          <CollectionBadge
            name={collection.name}
            color={collection.color}
            className="text-xs"
          />
        )}
        {bookmark.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
        {bookmark.tags.length > 3 && (
          <Badge
            variant="outline"
            className="text-xs"
            aria-label={`${bookmark.tags.length - 3} more tags`}
          >
            +{bookmark.tags.length - 3}
          </Badge>
        )}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${bookmark.title} in new tab`}
          className="ml-auto opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(pointer:coarse)]:opacity-100 transition-opacity p-1.5 -m-1.5 rounded-md hover:bg-accent/80 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <IconExternalLink aria-hidden="true" className="size-4 text-muted-foreground" />
        </a>
      </CardFooter>
    </Card>
  )
})
