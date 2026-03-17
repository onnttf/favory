"use client"

import { IconTag } from "@tabler/icons-react"

import { useBookmarks } from "@/lib/bookmark-store"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavTags() {
  const { allTags, tagCounts, state, dispatch } = useBookmarks()

  if (allTags.length === 0) return null

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Tags</SidebarGroupLabel>
      <SidebarMenu>
        {allTags.map((tag) => {
          const isActive = state.tagFilters.includes(tag)

          return (
            <SidebarMenuItem key={tag}>
              <SidebarMenuButton
                onClick={() => dispatch({ type: "TOGGLE_TAG_FILTER", tag })}
                isActive={isActive}
              >
                <IconTag aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="truncate">{tag}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {tagCounts[tag] ?? 0}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
