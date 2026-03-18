"use client"

import * as React from "react"
import { toast } from "sonner"

import type { Collection } from "@/lib/types"
import { useBookmarks, WORKER_URL, refreshCollections } from "@/lib/bookmark-store"
import { Button } from "@/components/ui/button"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PRESET_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
]

interface CollectionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection?: Collection | null
}

export function CollectionForm({
  open,
  onOpenChange,
  collection,
}: CollectionFormProps) {
  const { state, dispatch } = useBookmarks()
  const isEditing = !!collection

  const [name, setName] = React.useState("")
  const [color, setColor] = React.useState(PRESET_COLORS[0])
  const [parentId, setParentId] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (collection) {
      setName(collection.name)
      setColor(collection.color)
      setParentId(collection.parentId ?? null)
    } else {
      setName("")
      setColor(PRESET_COLORS[0])
      setParentId(null)
    }
  }, [collection, open])

  // Collections eligible as parent: all except self and own descendants
  const parentOptions = React.useMemo(() => {
    if (!collection) return state.collections
    // Collect all descendant IDs to exclude
    const excluded = new Set<string>([collection.id])
    let changed = true
    while (changed) {
      changed = false
      for (const c of state.collections) {
        if (c.parentId && excluded.has(c.parentId) && !excluded.has(c.id)) {
          excluded.add(c.id)
          changed = true
        }
      }
    }
    return state.collections.filter((c) => !excluded.has(c.id))
  }, [state.collections, collection])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const payload = { name: name.trim(), color, parentId }

    setSaving(true)
    try {
      const post = (path: string, body: object) =>
        fetch(`${WORKER_URL}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

      if (isEditing && collection) {
        await toast.promise(
          post("/collection/update", { id: collection.id, ...payload }).then(async (res) => {
            if (!res.ok) throw new Error("Failed to update")
            const updated: Collection = await res.json()
            dispatch({ type: "UPDATE_COLLECTION", collection: updated })
            await refreshCollections(dispatch, state.collectionFilter)
            onOpenChange(false)
          }),
          {
            loading: "Updating collection...",
            success: "Collection updated!",
            error: "Failed to update collection",
          }
        )
      } else {
        await toast.promise(
          post("/collection/create", payload).then(async (res) => {
            if (!res.ok) throw new Error("Failed to create")
            const created: Collection = await res.json()
            dispatch({ type: "ADD_COLLECTION", collection: created })
            await refreshCollections(dispatch, state.collectionFilter)
            onOpenChange(false)
          }),
          {
            loading: "Creating collection...",
            success: "Collection created!",
            error: "Failed to create collection",
          }
        )
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Collection" : "New Collection"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the collection name, color, and parent."
              : "Create a new collection to organize your bookmarks."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="col-name">Name *</Label>
            <Input
              id="col-name"
              placeholder="Collection name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="col-parent">Parent collection</Label>
            <Select
              value={parentId ?? "none"}
              onValueChange={(v) => setParentId(v === "none" ? null : v)}
            >
              <SelectTrigger id="col-parent">
                <SelectValue placeholder="None (root level)" />
              </SelectTrigger>
              <SelectContent style={{ width: "var(--radix-select-trigger-width)" }}>
                <SelectItem value="none">None (root level)</SelectItem>
                {parentOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block size-2 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.parentId
                        ? `${state.collections.find((p) => p.id === c.parentId)?.name ?? ""} / ${c.name}`
                        : c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="size-7 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "var(--foreground)" : "transparent",
                    transform: color === c ? "scale(1.15)" : "scale(1)",
                  }}
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                  aria-pressed={color === c}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="size-7 cursor-pointer rounded-full border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                title="Custom color"
                aria-label="Custom color"
              />
            </div>
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
              {isEditing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
