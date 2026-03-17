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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowUpIcon } from "lucide-react";

export function BookmarkDashboardContent() {
  const { state, dispatch, hasMore, loadMore } = useBookmarks();
  const loadingMore = state.loadingMore;
  const isFiltered = !!(state.search || state.collectionFilter || state.tagFilters.length);

  const [showScrollTop, setShowScrollTop] = React.useState(false);

  React.useEffect(() => {
    function onScroll() {
      setShowScrollTop(window.scrollY > 300);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        <div className="flex items-center gap-2 px-4 lg:px-6">
          <Skeleton className="h-9 flex-1 max-w-sm rounded-lg" />
          <Skeleton className="h-9 w-[72px] rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @sm/main:grid-cols-2 @lg/main:grid-cols-3 @2xl/main:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <BookmarkToolbar onAddBookmark={handleAddBookmark} />

      {/* Screen-reader loading announcement */}
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {state.loading ? "Loading bookmarks…" : ""}
      </p>

      {/* Refresh indicator — only shown when re-fetching with existing data */}
      <div className={cn(
        "h-0.5 mx-4 lg:mx-6 rounded-full overflow-hidden transition-opacity duration-150",
        state.loading && state.bookmarks.length > 0 ? "opacity-100" : "opacity-0"
      )}>
        <div className="h-full w-1/3 bg-primary rounded-full animate-[shimmer_1.2s_ease-in-out_infinite] [will-change:transform]" />
      </div>

      <div className={cn(
        "px-4 lg:px-6 transition-opacity duration-150",
        state.loading && state.bookmarks.length > 0 && "opacity-50 pointer-events-none"
      )}>
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
            hasMore={hasMore}
            loadingMore={loadingMore}
            loadMore={loadMore}
            total={state.total}
            isFiltered={isFiltered}
          />
        )}
      </div>

      {/* Bookmark CRUD form */}
      <BookmarkForm
        open={bookmarkFormOpen}
        onOpenChange={(open) => {
          setBookmarkFormOpen(open);
          if (!open) setEditingBookmark(null);
        }}
        bookmark={editingBookmark}
      />

      {/* Delete bookmark confirmation */}
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

      {/* Scroll to top */}
      {showScrollTop && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-md"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
        >
          <ArrowUpIcon className="h-4 w-4" />
        </Button>
      )}
    </>
  );
}
