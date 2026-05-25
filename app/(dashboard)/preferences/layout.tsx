import { AppLayout } from "@/components/layout/app-layout"
import { GlobalHeader } from "@/components/layout/global-header"
import { SidebarInset } from "@/components/ui/sidebar"
import type { ReactNode } from "react"

export default function PreferencesLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <AppLayout>
      <SidebarInset className="overflow-hidden">
        <GlobalHeader breadcrumb="Preferences" />
        {children}
      </SidebarInset>
    </AppLayout>
  )
}
