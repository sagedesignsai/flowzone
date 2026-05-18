import { AppLayout } from "@/components/layout/app-layout"
import { GlobalHeader } from "@/components/layout/global-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { ChatIndexContent } from "./chat-index-content"

export const metadata = {
  title: "Chats — Flowzone",
  description: "Browse your Flowzone chat conversations.",
}

export default function ChatIndexPage() {
  return (
    <AppLayout defaultSidebarOpen={false}>
      <SidebarInset className="overflow-hidden">
        <GlobalHeader breadcrumb="Chats" />
        <main className="flex flex-1 overflow-hidden">
          <ChatIndexContent />
        </main>
      </SidebarInset>
    </AppLayout>
  )
}
