"use client"

import { DesktopTerminalView } from "@/components/editor/desktop-terminal-view"
import { useChatDesktop, useIdeStore } from "@/hooks/use-ide-store"
import { cn } from "@/lib/utils"
import { Monitor, WarningCircle } from "@phosphor-icons/react"

interface TerminalViewProps {
  chatId: string
  className?: string
}

export function TerminalView({ chatId, className }: TerminalViewProps) {
  const desktop = useChatDesktop(chatId)
  const setViewMode = useIdeStore((s) => s.setViewMode)

  const status = desktop?.status ?? "idle"
  const sandboxId = desktop?.sandboxId

  // Sandbox is ready — show the PTY terminal
  if (status === "running" && sandboxId) {
    return (
      <DesktopTerminalView
        chatId={chatId}
        sandboxId={sandboxId}
        ptyPid={desktop.ptyPid ?? undefined}
        className={className}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex size-full flex-col items-center justify-center gap-3 text-center",
        className,
      )}
    >
      {status === "starting" && (
        <>
          <div className="size-5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
          <p className="text-xs text-muted-foreground">
            Starting desktop sandbox...
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <WarningCircle className="size-8 text-destructive/60" />
          <p className="text-xs text-destructive">
            Desktop sandbox failed to start
          </p>
          <button
            type="button"
            onClick={() => setViewMode("desktop")}
            className="mt-1 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </>
      )}

      {status === "idle" && (
        <>
          <Monitor className="size-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">
            Start the desktop sandbox to use the terminal
          </p>
        </>
      )}
    </div>
  )
}
