"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { GlobalSidebar } from "@/components/layout/global-sidebar"
import type { ReactNode } from "react"

interface AppLayoutProps {
  children: ReactNode
  /** Close sidebar by default (e.g. on active-chat routes) */
  defaultSidebarOpen?: boolean
}

/**
 * AppLayout — wraps every authenticated route with the shared
 * GlobalSidebar + SidebarProvider shell. Children land inside
 * SidebarInset and are responsible for their own content layout.
 */
export function AppLayout({
  children,
  defaultSidebarOpen = true,
}: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <GlobalSidebar />
      {children}
    </SidebarProvider>
  )
}
