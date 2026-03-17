"use client";

import * as React from "react";
import { IconInnerShadowTop } from "@tabler/icons-react";
import { useBookmarks } from "@/lib/bookmark-store";
import type { Collection } from "@/lib/types";
import { useDeleteCollection } from "@/hooks/use-delete-collection";
import { CollectionForm } from "@/components/collection-form";
import { NavCollections } from "@/components/nav-collections";
import { NavTags } from "@/components/nav-tags";
import { NavUser } from "@/components/nav-user";
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// TODO: Replace with actual user data from auth provider
const user = {
  name: "User",
  email: "your-email@example.com",
  avatar: "",
};

function CollectionActions() {
  const { state } = useBookmarks();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingCollection, setEditingCollection] =
    React.useState<Collection | null>(null);
  const { deleteId, onDelete, confirmDelete, cancelDelete } =
    useDeleteCollection();

  function handleAdd() {
    setEditingCollection(null);
    setFormOpen(true);
  }

  function handleEdit(id: string) {
    const col = state.collections.find((c) => c.id === id) ?? null;
    setEditingCollection(col);
    setFormOpen(true);
  }

  return (
    <>
      <NavCollections
        onAddCollection={handleAdd}
        onEditCollection={handleEdit}
        onDeleteCollection={onDelete}
      />
      <NavTags />

      <CollectionForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingCollection(null);
        }}
        collection={editingCollection}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && cancelDelete()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              Bookmarks in this collection will become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">Favory</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <CollectionActions />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
