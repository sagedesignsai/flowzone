import { AppLayout } from "@/components/layout/app-layout"
import { GlobalHeader } from "@/components/layout/global-header"
import { SidebarInset } from "@/components/ui/sidebar"
import type { ReactNode } from "react"

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <AppLayout>
      <SidebarInset className="overflow-hidden">
        <GlobalHeader breadcrumb="Profile" />
        {children}
      </SidebarInset>
    </AppLayout>
  )
}
