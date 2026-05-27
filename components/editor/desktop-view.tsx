"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useChatDesktop, useIdeStore } from "@/hooks/use-ide-store"
import { cn } from "@/lib/utils"
import { Monitor, TerminalWindow, Power } from "@phosphor-icons/react"
import { deleteDesktop } from "@/lib/desktop-client"
import { toast } from "sonner"
import { DesktopTerminalView } from "@/components/editor/desktop-terminal-view"

import "@xterm/xterm/css/xterm.css"

interface DesktopViewProps {
  chatId: string
  className?: string
}

export function DesktopView({ chatId, className }: DesktopViewProps) {
  const desktop = useChatDesktop(chatId)
  const setChatDesktop = useIdeStore((s) => s.setChatDesktop)
  const clearChatDesktop = useIdeStore((s) => s.clearChatDesktop)
  const setChatDesktopStatus = useIdeStore((s) => s.setChatDesktopStatus)
  const setViewMode = useIdeStore((s) => s.setViewMode)

  const sandboxId = desktop?.sandboxId ?? null
  const vncUrl = desktop?.vncUrl ?? null

  const [isStopping, setIsStopping] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [displayMode, setDisplayMode] = useState<"vnc" | "terminal">("vnc")
  const hasAttemptedReconnect = useRef(false)

  useEffect(() => {
    if (!sandboxId || vncUrl || hasAttemptedReconnect.current) return
    hasAttemptedReconnect.current = true

    setChatDesktopStatus(chatId, "starting")
    setIsReconnecting(true)

    fetch(`/api/desktop/${sandboxId}`, { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          clearChatDesktop(chatId)
          setViewMode("code")
          return
        }
        const data = await res.json()
        setChatDesktop(chatId, {
          sandboxId: data.sandboxId,
          vncUrl: data.vncUrl,
          status: "running",
        })
        toast.success("Desktop reconnected")
      })
      .catch(() => {
        clearChatDesktop(chatId)
        setViewMode("code")
        toast.info("Desktop session expired")
      })
      .finally(() => {
        setIsReconnecting(false)
      })
  }, [
    sandboxId,
    vncUrl,
    chatId,
    setChatDesktop,
    clearChatDesktop,
    setChatDesktopStatus,
    setViewMode,
  ])

  useEffect(() => {
    hasAttemptedReconnect.current = false
  }, [chatId])

  useEffect(() => {
    if (!sandboxId) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/desktop/${sandboxId}/status`)
        if (!response.ok) {
          clearChatDesktop(chatId)
          toast.info("Desktop session expired")
        }
      } catch (err) {
        console.error("Failed to check desktop status:", err)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [sandboxId, chatId, clearChatDesktop])

  const handleStop = async () => {
    if (!sandboxId) return
    setIsStopping(true)
    try {
      await deleteDesktop(sandboxId, chatId)
      clearChatDesktop(chatId)
      setViewMode("code")
      toast.success("Desktop stopped")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to stop desktop"
      toast.error(message)
      clearChatDesktop(chatId)
      setViewMode("code")
    } finally {
      setIsStopping(false)
    }
  }

  return (
    <div className={cn("flex size-full flex-col overflow-hidden", className)}>
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-background px-3">
        <div className="flex items-center gap-2">
          <Monitor className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Desktop</span>
            {sandboxId && (
            <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
              <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
              {isReconnecting ? "Reconnecting…" : "Running"}
            </span>
          )}
          {sandboxId && (
            <div className="ml-2 flex items-center gap-0.5 rounded-md border border-border bg-muted/50 p-0.5">
              <button
                onClick={() => setDisplayMode("vnc")}
                className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  displayMode === "vnc"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="VNC Desktop"
              >
                <Monitor className="mr-1 inline-block size-3" />
                VNC
              </button>
              <button
                onClick={() => setDisplayMode("terminal")}
                className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  displayMode === "terminal"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Terminal (PTY)"
              >
                <TerminalWindow className="mr-1 inline-block size-3" />
                Terminal
              </button>
            </div>
          )}
        </div>
        {sandboxId && (
          <Button
            disabled={isStopping}
            onClick={handleStop}
            size="sm"
            variant="ghost"
            className="h-6 gap-1 text-[10px] text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Power className="size-3" />
            {isStopping ? "Stopping…" : "Stop"}
          </Button>
        )}
      </div>

      {isReconnecting ? (
        <div className="flex size-full flex-col items-center justify-center gap-3 text-center">
          <Monitor className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            Reconnecting to desktop…
          </p>
        </div>
      ) : vncUrl && displayMode === "vnc" ? (
        <iframe
          src={vncUrl}
          className="size-full border-0"
          allow="clipboard-read; clipboard-write"
          title="Desktop Sandbox"
        />
      ) : vncUrl && displayMode === "terminal" ? (
        <DesktopTerminalView
          chatId={chatId}
          sandboxId={sandboxId ?? ""}
          ptyPid={desktop?.ptyPid}
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-3 text-center">
          <Monitor className="size-8 text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              No desktop session
            </p>
            <p className="text-xs text-muted-foreground/60">
              Start a desktop sandbox to enable computer-use tools
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
