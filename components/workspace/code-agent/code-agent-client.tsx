"use client"

import { useEffect } from "react"
import { GlobalHeader } from "@/components/layout/global-header"
import { ChatPanel } from "@/components/chat/chat-panel"
import { CodeAgentTerminalView } from "@/components/workspace/code-agent/code-agent-terminal-view"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useIdeStore } from "@/hooks/use-ide-store"
import type { UIMessage } from "ai"

interface CodeAgentPageClientProps {
  chatId: string
  initialMessages: UIMessage[]
  projectId?: string
  title: string
}

/**
 * Code Agent Chat Client
 *
 * Resizable panels layout: chat (left) | terminal (right).
 * Routes messages to the PTY-powered Virtual Developer agent running
 * inside an E2B sandbox with interactive terminal access.
 *
 * API endpoint: /api/workspace/code-agent
 * Terminal SSE:  /api/workspace/code-agent/terminal?chatId=xxx
 */
export function CodeAgentPageClient({
  chatId,
  initialMessages,
  projectId,
  title,
}: CodeAgentPageClientProps) {
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

  return (
    <>
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
              apiPath="/api/workspace/code-agent"
              desktopOptOut={true}
              className="size-full"
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="65%" minSize="30%">
            <CodeAgentTerminalView
              chatId={chatId}
              className="size-full"
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  )
}
