"use client"

import * as React from "react"
import { IconPlus, IconPencil, IconTrash } from "@tabler/icons-react"

import { useBookmarks } from "@/lib/bookmark-store"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

interface NavCollectionsProps {
  onAddCollection: () => void
  onEditCollection: (id: string) => void
  onDeleteCollection: (id: string) => void
}

export function NavCollections({
  onAddCollection,
  onEditCollection,
  onDeleteCollection,
}: NavCollectionsProps) {
  const { state, dispatch, bookmarkCounts, globalTotal } = useBookmarks()

  const rootCollections = state.collections.filter((c) => !c.parentId)
  const childCollections = state.collections.filter((c) => c.parentId)

  const getChildren = (parentId: string) =>
    childCollections.filter((c) => c.parentId === parentId)

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Collections</SidebarGroupLabel>
      <SidebarGroupAction title="Add collection" onClick={onAddCollection}>
        <IconPlus />
        <span className="sr-only">Add collection</span>
      </SidebarGroupAction>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() =>
              dispatch({ type: "SET_COLLECTION_FILTER", collectionId: null })
            }
            isActive={state.collectionFilter === null}
          >
            <span>All Bookmarks</span>
            <span className="ml-auto text-xs text-muted-foreground opacity-0 group-hover/menu-item:opacity-100 transition-opacity">
              {globalTotal}
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {rootCollections.map((collection) => {
          const children = getChildren(collection.id)
          const count = bookmarkCounts[collection.id] || 0
          const isActive = state.collectionFilter === collection.id

          return (
            <SidebarMenuItem key={collection.id}>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <SidebarMenuButton
                    onClick={() => dispatch({ type: "SET_COLLECTION_FILTER", collectionId: collection.id })}
                    isActive={isActive}
                  >
                    <div
                      aria-hidden="true"
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: collection.color }}
                    />
                    <span>{collection.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground opacity-0 group-hover/menu-item:opacity-100 transition-opacity">
                      {count}
                    </span>
                  </SidebarMenuButton>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-36">
                  <ContextMenuItem onClick={() => onEditCollection(collection.id)}>
                    <IconPencil aria-hidden="true" />
                    <span>Edit</span>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    variant="destructive"
                    onClick={() => onDeleteCollection(collection.id)}
                  >
                    <IconTrash aria-hidden="true" />
                    <span>Delete</span>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>

              {children.length > 0 && (
                <SidebarMenuSub>
                  {children.map((child) => (
                    <SidebarMenuSubItem key={child.id}>
                      <ContextMenu>
                        <ContextMenuTrigger asChild>
                          <SidebarMenuSubButton
                            onClick={() => dispatch({ type: "SET_COLLECTION_FILTER", collectionId: child.id })}
                            isActive={state.collectionFilter === child.id}
                          >
                            <div
                              aria-hidden="true"
                              className="size-2 rounded-full shrink-0"
                              style={{ backgroundColor: child.color }}
                            />
                            <span>{child.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground opacity-0 group-hover/menu-sub-item:opacity-100 transition-opacity">
                              {bookmarkCounts[child.id] || 0}
                            </span>
                          </SidebarMenuSubButton>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-36">
                          <ContextMenuItem onClick={() => onEditCollection(child.id)}>
                            <IconPencil />
                            <span>Edit</span>
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem
                            variant="destructive"
                            onClick={() => onDeleteCollection(child.id)}
                          >
                            <IconTrash />
                            <span>Delete</span>
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
