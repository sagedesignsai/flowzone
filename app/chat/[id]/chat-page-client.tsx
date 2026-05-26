"use client"

import { useEffect, useState, useCallback } from "react"
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
import { Spinner } from "@/components/ui/spinner"
import { Warning, X } from "@phosphor-icons/react"
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
  desktopOptOut: initialDesktopOptOut,
}: ChatPageClientProps) {
  const [skipDesktop, setSkipDesktop] = useState(initialDesktopOptOut)
  const [dismissedOverlay, setDismissedOverlay] = useState(false)

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
    desktopOptOut: skipDesktop,
    skipAutoLaunch: skipDesktop || dismissedOverlay,
  })

  const handleSkipDesktop = useCallback(async () => {
    setDismissedOverlay(true)
    setSkipDesktop(true)
    await desktop.optOut()
  }, [desktop])

  const handleRetry = useCallback(async () => {
    setDismissedOverlay(false)
    setSkipDesktop(false)
    await desktop.retry()
  }, [desktop])

  const showLaunchOverlay =
    !skipDesktop &&
    !dismissedOverlay &&
    (desktop.isLaunching || desktop.status === "starting")

  const showErrorOverlay =
    !skipDesktop &&
    !dismissedOverlay &&
    !desktop.isLaunching &&
    desktop.status === "error"

  return (
    <AppLayout defaultSidebarOpen={false}>
      <SidebarInset className="max-h-dvh overflow-hidden">
        <GlobalHeader breadcrumb={title} showActions chatId={chatId} />

        <div className="relative flex flex-1 overflow-hidden">
          {showLaunchOverlay && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
              <Spinner className="size-8 text-primary" />
              <p className="text-sm text-muted-foreground">
                Starting desktop sandbox…
              </p>
              <p className="max-w-xs text-center text-xs text-muted-foreground/60">
                Provisioning a cloud desktop with OpenCode, your project tools,
                and VNC streaming.
              </p>
              <button
                type="button"
                onClick={handleSkipDesktop}
                className="mt-2 text-xs text-muted-foreground/50 underline underline-offset-2 hover:text-muted-foreground"
              >
                Skip — use chat only
              </button>
            </div>
          )}

          {showErrorOverlay && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
              <Warning className="size-10 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                Desktop sandbox failed to start
              </p>
              <p className="max-w-sm text-center text-xs text-muted-foreground">
                {desktop.error ??
                  "The sandbox could not be created. Check your E2B configuration and try again, or continue in chat-only mode."}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={desktop.isLaunching}
                  className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {desktop.isLaunching ? "Retrying…" : "Retry"}
                </button>
                <button
                  type="button"
                  onClick={handleSkipDesktop}
                  className="rounded-md border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent"
                >
                  <X className="mr-1 inline size-3" />
                  Chat only
                </button>
              </div>
            </div>
          )}

          <ResizablePanelGroup
            className="flex-1 overflow-hidden"
            orientation="horizontal"
          >
            <ResizablePanel defaultSize="35%" maxSize="55%" minSize="24%">
              <ChatPanel
                chatId={chatId}
                initialMessages={initialMessages}
                projectId={projectId}
                desktopSandboxId={skipDesktop ? null : desktop.sandboxId}
                desktopReady={
                  skipDesktop ||
                  desktop.isReady ||
                  desktop.status === "error"
                }
                desktopOptOut={skipDesktop}
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
