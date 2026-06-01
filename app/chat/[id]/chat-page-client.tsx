"use client"

import { useEffect } from "react"
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
import { useChatDesktopManager } from "@/hooks/use-chat-desktop"
import { useIdeStore } from "@/hooks/use-ide-store"
import type { UIMessage } from "ai"

interface ChatPageClientProps {
  chatId: string
  initialMessages: UIMessage[]
  projectId?: string
  title: string
  desktopOptOut: boolean
}

export function ChatPageClient({
  chatId,
  initialMessages,
  projectId,
  title,
  desktopOptOut,
}: ChatPageClientProps) {
  const setActiveChatId = useIdeStore((s) => s.setActiveChatId)
  const addChatSession = useIdeStore((s) => s.addChatSession)

  useEffect(() => {
    setActiveChatId(chatId)
    addChatSession({
      id: chatId,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      projectId: projectId ?? null,
    })
  }, [chatId, title, projectId, setActiveChatId, addChatSession])

  const desktop = useChatDesktopManager({
    chatId,
    projectId,
    desktopOptOut,
  })

  return (
    <AppLayout defaultSidebarOpen={false}>
      <SidebarInset className="max-h-dvh overflow-hidden">
        <GlobalHeader breadcrumb={title} showActions chatId={chatId} />

        <div className="flex flex-1 overflow-hidden">
          <ResizablePanelGroup
            className="flex-1 overflow-hidden"
            orientation="horizontal"
          >
            <ResizablePanel defaultSize="35%" maxSize="55%" minSize="24%">
              <ChatPanel
                chatId={chatId}
                initialMessages={initialMessages}
                projectId={projectId}
                desktopSandboxId={
                  desktopOptOut ? null : desktop.sandboxId
                }
                desktopReady={
                  desktopOptOut || desktop.isReady || desktop.status === "error"
                }
                desktopStatus={desktop.status}
                desktopOptOut={desktopOptOut}
                className="size-full"
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize="65%" minSize="30%">
              <EditorPanel chatId={chatId} className="size-full" />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </SidebarInset>
    </AppLayout>
  )
}
