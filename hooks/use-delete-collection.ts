"use client"

import * as React from "react"
import { toast } from "sonner"

import { useBookmarks, WORKER_URL } from "@/lib/bookmark-store"

export function useDeleteCollection() {
  const { dispatch } = useBookmarks()
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  function onDelete(id: string) {
    setDeleteId(id)
  }

  async function confirmDelete() {
    if (!deleteId) return
    const id = deleteId
    setDeleteId(null)

    toast.promise(
      fetch(`${WORKER_URL}/collection/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).then(async (res) => {
        if (!res.ok) throw new Error("Failed to delete")
        const { parentId } = await res.json()
        dispatch({ type: "DELETE_COLLECTION", id, parentId: parentId ?? null })
      }),
      {
        loading: "Deleting collection...",
        success: "Collection deleted!",
        error: "Failed to delete collection",
      },
    )
  }

  return {
    deleteId,
    onDelete,
    confirmDelete,
    cancelDelete: () => setDeleteId(null),
  }
}
