"use client"

import { useEffect, useState } from "react"
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
type InitStatus = "idle" | "initializing" | "ready" | "error"

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
 * On mount, initializes the sandbox + PTY + opencode TUI so the
 * user sees the terminal environment immediately.
 *
 * Routes messages to the PTY-powered Virtual Developer agent running
 * inside an E2B sandbox with interactive terminal access.
 *
 * API endpoint: /api/workspace/code-agent
 * Init endpoint: POST /api/workspace/code-agent/init
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
  const [initStatus, setInitStatus] = useState<InitStatus>("idle")
  const [initError, setInitError] = useState<string | null>(null)
  const [initKey, setInitKey] = useState(0)

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

  // ── Initialize sandbox + PTY + opencode on mount ──────
  useEffect(() => {
    let cancelled = false

    async function init() {
      setInitStatus("initializing")
      setInitError(null)

      try {
        const res = await fetch("/api/workspace/code-agent/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, projectId }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? `Init failed (${res.status})`)
        }

        const data = await res.json()
        if (!cancelled) {
          console.debug(
            `[code-agent] init complete — sandbox: ${data.sandboxId}, pty: ${data.ptyPid}, reused: ${data.reused}`,
          )
          setInitStatus("ready")
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Initialization failed"
          console.error("[code-agent] init error:", message)
          setInitError(message)
          setInitStatus("error")
        }
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [chatId, projectId, initKey])

  const initReady = initStatus === "ready" || initStatus === "error"

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
              initReady={initReady}
              className="size-full"
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="65%" minSize="30%">
            <div className="relative size-full">
              <CodeAgentTerminalView
                chatId={chatId}
                className="size-full"
              />

              {/* Loading overlay while init runs */}
              {initStatus === "initializing" && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0a0a0b]/80">
                  <div className="size-6 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
                  <p className="text-sm text-zinc-400">
                    Setting up sandbox...
                  </p>
                  <p className="max-w-xs text-center text-xs text-zinc-500">
                    Creating a secure sandbox with opencode ready to go
                  </p>
                </div>
              )}

              {/* Error overlay */}
              {initStatus === "error" && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0a0a0b]/80">
                  <p className="text-sm text-red-400">
                    Failed to initialize
                  </p>
                  {initError && (
                    <p className="max-w-md text-center text-xs text-zinc-400">
                      {initError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setInitKey((k) => k + 1)}
                    className="mt-1 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  )
}
