import * as React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { BookmarkView } from "@/components/bookmark-view"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { BookmarkProvider } from "@/lib/bookmark-store"

export default function Page() {
  return (
    <BookmarkProvider>
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:ring-2 focus:ring-ring focus:rounded-md"
      >
        Skip to main content
      </a>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <main id="main-content" className="flex flex-col h-[calc(100vh-var(--header-height))] overflow-hidden">
            <h1 className="sr-only">Bookmarks</h1>
            <BookmarkView />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </BookmarkProvider>
  )
}
