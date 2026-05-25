"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useIdeStore } from "@/hooks/use-ide-store"
import { cn } from "@/lib/utils"
import { Monitor, Power } from "@phosphor-icons/react"
import { deleteDesktop } from "@/lib/desktop-client"
import { toast } from "sonner"

export function DesktopView({ className }: { className?: string }) {
  const {
    desktopSandboxId,
    desktopVncUrl,
    setDesktopSandbox,
    clearDesktopSandbox,
    setDesktopStatus,
    setViewMode,
  } = useIdeStore()

  const [isStopping, setIsStopping] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const hasAttemptedReconnect = useRef(false)

  // ── Reconnect on mount if sandboxId is set but VNC may be stale ──
  useEffect(() => {
    if (!desktopSandboxId || hasAttemptedReconnect.current) return
    hasAttemptedReconnect.current = true

    // If we have a sandboxId on mount (e.g. after page reload), reconnect to refresh VNC stream
    setDesktopStatus("starting")
    setIsReconnecting(true)

    fetch(`/api/desktop/${desktopSandboxId}`, { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          clearDesktopSandbox()
          setViewMode("preview")
          return
        }
        const data = await res.json()
        setDesktopSandbox(data.sandboxId, data.vncUrl)
        toast.success("Desktop reconnected")
      })
      .catch(() => {
        clearDesktopSandbox()
        setViewMode("preview")
        toast.info("Desktop session expired")
      })
      .finally(() => {
        setIsReconnecting(false)
      })
  }, [
    desktopSandboxId,
    setDesktopSandbox,
    clearDesktopSandbox,
    setDesktopStatus,
    setViewMode,
  ])

  // ── Monitor sandbox status (keep-alive check) ──
  useEffect(() => {
    if (!desktopSandboxId) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/desktop/${desktopSandboxId}/status`)
        if (!response.ok) {
          clearDesktopSandbox()
          setViewMode("preview")
          toast.info("Desktop session expired")
        }
      } catch (error) {
        console.error("Failed to check desktop status:", error)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [desktopSandboxId, clearDesktopSandbox, setViewMode])

  const handleStop = async () => {
    if (!desktopSandboxId) return
    setIsStopping(true)
    try {
      await deleteDesktop(desktopSandboxId)
      clearDesktopSandbox()
      setViewMode("preview")
      toast.success("Desktop stopped")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to stop desktop"
      toast.error(message)
      clearDesktopSandbox()
      setViewMode("preview")
    } finally {
      setIsStopping(false)
    }
  }

  return (
    <div className={cn("flex size-full flex-col overflow-hidden", className)}>
      {/* Header bar */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-background px-3">
        <div className="flex items-center gap-2">
          <Monitor className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Desktop</span>
          {desktopSandboxId && (
            <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
              <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
              {isReconnecting ? "Reconnecting…" : "Running"}
            </span>
          )}
        </div>
        {desktopSandboxId && (
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

      {/* Content */}
      {isReconnecting ? (
        <div className="flex size-full flex-col items-center justify-center gap-3 text-center">
          <Monitor className="size-8 text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Reconnecting to desktop…
            </p>
          </div>
        </div>
      ) : desktopVncUrl ? (
        <iframe
          src={desktopVncUrl}
          className="size-full border-0"
          allow="clipboard-read; clipboard-write"
          title="Desktop Sandbox"
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-3 text-center">
          <Monitor className="size-8 text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              No desktop session
            </p>
            <p className="text-xs text-muted-foreground/60">
              Start a desktop sandbox to enable computer-use agent
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
