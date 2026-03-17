"use client"

import * as React from "react"
import { toast } from "sonner"

import type { Bookmark, Collection } from "@/lib/types"
import { useBookmarks, WORKER_URL } from "@/lib/bookmark-store"
import { Check, ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"

interface BookmarkFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmark?: Bookmark | null
}

export function BookmarkForm({ open, onOpenChange, bookmark }: BookmarkFormProps) {
  const { state, dispatch } = useBookmarks()
  const isEditing = !!bookmark

  const [url, setUrl] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [collectionId, setCollectionId] = React.useState<string>("none")
  const [collectionOpen, setCollectionOpen] = React.useState(false)

  // Build a depth-aware flat list sorted by hierarchy
  const collectionOptions = React.useMemo(() => {
    const roots = state.collections.filter((c) => !c.parentId)
    const result: { id: string; name: string; color: string; depth: number; path: string }[] = []

    function walk(id: string, depth: number, pathPrefix: string) {
      const col = state.collections.find((c) => c.id === id)
      if (!col) return
      const path = pathPrefix ? `${pathPrefix} / ${col.name}` : col.name
      result.push({ id: col.id, name: col.name, color: col.color, depth, path })
      state.collections
        .filter((c) => c.parentId === col.id)
        .forEach((child) => walk(child.id, depth + 1, path))
    }

    roots.forEach((r) => walk(r.id, 0, ""))
    return result
  }, [state.collections])

  const [tagsInput, setTagsInput] = React.useState("")
  const [tags, setTags] = React.useState<string[]>([])
  const [saving, setSaving] = React.useState(false)

  // Reset form when bookmark changes
  React.useEffect(() => {
    if (bookmark) {
      setUrl(bookmark.url)
      setTitle(bookmark.title)
      setDescription(bookmark.description ?? "")
      setCollectionId(bookmark.collectionId ?? "none")
      setTags(bookmark.tags)
    } else {
      setUrl("")
      setTitle("")
      setDescription("")
      setCollectionId("none")
      setTags([])
    }
    setTagsInput("")
  }, [bookmark, open])

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag])
    }
    setTagsInput("")
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url || !title) return

    const domain = (() => {
      try { return new URL(url).hostname } catch { return "" }
    })()

    const payload = {
      url,
      title,
      description: description || null,
      tags,
      collectionId: collectionId === "none" ? null : collectionId,
      favicon: domain
        ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
        : undefined,
    }

    setSaving(true)
    try {
      const post = (path: string, body: object) =>
        fetch(`${WORKER_URL}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

      if (isEditing && bookmark) {
        await toast.promise(
          post("/bookmark/update", { id: bookmark.id, ...payload }).then(async (res) => {
            if (!res.ok) throw new Error("Failed to update")
            const updated: Bookmark = await res.json()
            dispatch({ type: "UPDATE_BOOKMARK", bookmark: updated })
            onOpenChange(false)
          }),
          {
            loading: "Updating bookmark...",
            success: "Bookmark updated!",
            error: "Failed to update bookmark",
          }
        )
      } else {
        await toast.promise(
          post("/bookmark/create", payload).then(async (res) => {
            if (!res.ok) throw new Error("Failed to create")
            const created: Bookmark = await res.json()
            dispatch({ type: "ADD_BOOKMARK", bookmark: created })
            onOpenChange(false)
          }),
          {
            loading: "Saving bookmark...",
            success: "Bookmark added!",
            error: "Failed to save bookmark",
          }
        )
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Bookmark" : "Add Bookmark"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the bookmark details below."
              : "Save a new URL to your bookmarks."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="bm-url">
              URL <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="bm-url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              aria-required="true"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bm-title">
              Title <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="bm-title"
              placeholder="Page title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              aria-required="true"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bm-desc">Description</Label>
            <Textarea
              id="bm-desc"
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Collection</Label>
            <Popover open={collectionOpen} onOpenChange={setCollectionOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={collectionOpen}
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate text-sm">
                    {collectionId !== "none"
                      ? (() => {
                          const opt = collectionOptions.find((c) => c.id === collectionId)
                          return opt ? (
                            <span className="flex items-center gap-2">
                              <span className="size-2 rounded-full shrink-0 inline-block" style={{ backgroundColor: opt.color }} />
                              {opt.path}
                            </span>
                          ) : "None"
                        })()
                      : <span className="text-muted-foreground">None</span>
                    }
                  </span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start" style={{ width: "var(--radix-popover-trigger-width)" }}>
                <Command>
                  <CommandInput placeholder="Search collections..." />
                  <CommandList
                    className="max-h-60 overflow-y-auto"
                    onWheel={(e) => e.stopPropagation()}
                  >
                    <CommandEmpty>No collections found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        onSelect={() => { setCollectionId("none"); setCollectionOpen(false) }}
                      >
                        <Check className={`mr-2 size-4 ${collectionId === "none" ? "opacity-100" : "opacity-0"}`} />
                        <span className="text-muted-foreground">None</span>
                      </CommandItem>
                      {collectionOptions.map((opt) => (
                        <CommandItem
                          key={opt.id}
                          value={opt.path}
                          onSelect={() => { setCollectionId(opt.id); setCollectionOpen(false) }}
                        >
                          <Check className={`mr-2 size-4 shrink-0 ${collectionId === opt.id ? "opacity-100" : "opacity-0"}`} />
                          <span style={{ paddingLeft: opt.depth * 16 }} className="flex items-center gap-2 min-w-0">
                            <span className="size-2 rounded-full shrink-0 inline-block" style={{ backgroundColor: opt.color }} />
                            <span className="truncate">{opt.name}</span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bm-tags">Tags</Label>
            <div className="flex flex-wrap gap-1 min-h-8">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove tag: ${tag}`}
                  onClick={() => removeTag(tag)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      removeTag(tag)
                    }
                  }}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
            <Input
              id="bm-tags"
              placeholder="Add a tag and press Enter"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addTag(tagsInput)
                }
              }}
              onBlur={() => tagsInput && addTag(tagsInput)}
            />
            <p className="text-xs text-muted-foreground">
              Press Enter to add. Click to remove.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {isEditing ? "Save changes" : "Add Bookmark"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
