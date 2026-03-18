"use client";

import * as React from "react";
import { toast } from "sonner";

import type { Bookmark } from "@/lib/types";
import { useBookmarks, WORKER_URL } from "@/lib/bookmark-store";
import { BookmarkForm } from "@/components/bookmark-form";
import { BookmarkGrid } from "@/components/bookmark-grid";
import { BookmarkTable } from "@/components/bookmark-table";
import { BookmarkToolbar } from "@/components/bookmark-toolbar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function BookmarkView() {
  const { state, dispatch, hasMore, loadMore } = useBookmarks();
  const loadingMore = state.loadingMore;
  const isFiltered = !!(state.search || state.collectionFilter || state.tagFilters.length);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const isLoadingRef = React.useRef(false);
  const mountedRef = React.useRef(false);

  React.useEffect(() => {
    mountedRef.current = true;
  }, []);

  React.useEffect(() => {
    if (!scrollRef.current || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          hasMore &&
          !loadingMore &&
          !isLoadingRef.current &&
          mountedRef.current
        ) {
          isLoadingRef.current = true;
          loadMore();
        }
      },
      {
        root: scrollRef.current,
        rootMargin: "100px",
        threshold: 0,
      }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  React.useEffect(() => {
    if (!loadingMore) {
      isLoadingRef.current = false;
    }
  }, [loadingMore]);

  const [bookmarkFormOpen, setBookmarkFormOpen] = React.useState(false);
  const [editingBookmark, setEditingBookmark] = React.useState<Bookmark | null>(
    null,
  );
  const [deleteBookmarkId, setDeleteBookmarkId] = React.useState<string | null>(
    null,
  );

  function handleEditBookmark(bookmark: Bookmark) {
    setEditingBookmark(bookmark);
    setBookmarkFormOpen(true);
  }

  function handleAddBookmark() {
    setEditingBookmark(null);
    setBookmarkFormOpen(true);
  }

  function handleDeleteBookmark(id: string) {
    setDeleteBookmarkId(id);
  }

  async function confirmDeleteBookmark() {
    if (!deleteBookmarkId) return;
    const id = deleteBookmarkId;
    setDeleteBookmarkId(null);

    toast.promise(
      fetch(`${WORKER_URL}/bookmark/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).then(async (res) => {
        if (!res.ok) throw new Error("Failed to delete");
        dispatch({ type: "DELETE_BOOKMARK", id });
      }),
      {
        loading: "Deleting bookmark...",
        success: "Bookmark deleted!",
        error: "Failed to delete bookmark",
      },
    );
  }

  // Only show full skeleton on true initial load (no data yet)
  if (state.loading && state.bookmarks.length === 0) {
    return (
      <>
        <h2 className="sr-only">Loading bookmarks</h2>
        <div className="flex items-center gap-2 px-4 lg:px-6 py-2 shrink-0">
          <Skeleton className="h-9 flex-1 max-w-sm rounded-lg" />
          <Skeleton className="h-9 w-[72px] rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="h-0.5 mx-4 lg:mx-6 rounded-full overflow-hidden shrink-0">
          <div className="h-full w-1/3 bg-primary rounded-full animate-[shimmer_1.2s_ease-in-out_infinite] [will-change:transform]" />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 lg:px-6 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BookmarkToolbar onAddBookmark={handleAddBookmark} />

      <div
        className={cn(
          "h-0.5 mx-4 lg:mx-6 rounded-full overflow-hidden transition-opacity duration-200 shrink-0",
          state.loading && state.bookmarks.length > 0 ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="h-full w-1/3 bg-primary rounded-full animate-[shimmer_1.2s_ease-in-out_infinite] [will-change:transform]" />
      </div>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {state.loading ? "Loading bookmarks…" : ""}
      </p>

      <div
        className={cn(
          "flex-1 min-h-0 overflow-y-auto px-4 lg:px-6 py-4 transition-opacity duration-200",
          state.loading && state.bookmarks.length > 0 && "opacity-50 pointer-events-none"
        )}
        ref={scrollRef}
      >
        {state.viewMode === "grid" ? (
          <BookmarkGrid
            bookmarks={state.bookmarks}
            collections={state.collections}
            onEdit={handleEditBookmark}
            onDelete={handleDeleteBookmark}
            onAdd={handleAddBookmark}
            hasMore={hasMore}
            loadingMore={loadingMore}
            loadMore={loadMore}
            total={state.total}
            isFiltered={isFiltered}
          />
        ) : (
          <BookmarkTable
            bookmarks={state.bookmarks}
            collections={state.collections}
            onEdit={handleEditBookmark}
            onDelete={handleDeleteBookmark}
            onAdd={handleAddBookmark}
            loadingMore={loadingMore}
            loadMore={loadMore}
            total={state.total}
            isFiltered={isFiltered}
          />
        )}

        <div ref={sentinelRef} className="h-4" />
      </div>

      <BookmarkForm
        open={bookmarkFormOpen}
        onOpenChange={(open) => {
          setBookmarkFormOpen(open);
          if (!open) setEditingBookmark(null);
        }}
        bookmark={editingBookmark}
      />

      <AlertDialog
        open={!!deleteBookmarkId}
        onOpenChange={(open) => !open && setDeleteBookmarkId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bookmark?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBookmark}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
