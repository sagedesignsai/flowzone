import { AppLayout } from "@/components/layout/app-layout"
import { SidebarInset } from "@/components/ui/sidebar"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  return (
    <AppLayout defaultSidebarOpen={false}>
      <SidebarInset className="flex flex-col max-h-dvh overflow-hidden">
        {children}
      </SidebarInset>
    </AppLayout>
  )
}
