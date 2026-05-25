import { AppLayout } from "@/components/layout/app-layout"
import { GlobalHeader } from "@/components/layout/global-header"
import { ChatPanel } from "@/components/chat/chat-panel"
import { EditorPanel } from "@/components/editor/editor-panel"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { SidebarInset } from "@/components/ui/sidebar"
import { notFound, redirect } from "next/navigation"
import { loadChat } from "@/lib/chat/store"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

interface ChatPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ChatPageProps) {
  const { id } = await params
  return {
    title: `Chat ${id} — Flowzone`,
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  // Ensure user can access this chat
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  // Check if chat exists and belongs to user
  const chat = await prisma.chat.findUnique({
    where: { id },
    select: { userId: true },
  })

  // If chat exists but doesn't belong to user, return 404
  if (chat && chat.userId !== session.user.id) {
    notFound()
  }

  // Load initial messages for the chat
  const initialMessages = await loadChat(id)

  return (
    <AppLayout defaultSidebarOpen={false}>
      <SidebarInset className="overflow-hidden">
        <GlobalHeader breadcrumb="New chat" showActions chatId={id} />

        <ResizablePanelGroup
          className="flex-1 overflow-hidden"
          orientation="horizontal"
        >
          {/* ── Chat ─────────────────────────────────────────────── */}
          <ResizablePanel defaultSize="35%" maxSize="55%" minSize="24%">
            <ChatPanel
              chatId={id}
              initialMessages={initialMessages}
              className="size-full"
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* ── Editor / Preview / Terminal ───────────────────────── */}
          <ResizablePanel defaultSize="65%" minSize="30%">
            <EditorPanel chatId={id} className="size-full" />
          </ResizablePanel>
        </ResizablePanelGroup>
      </SidebarInset>
    </AppLayout>
  )
}
