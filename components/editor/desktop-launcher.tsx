"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useChatDesktop, useIdeStore } from "@/hooks/use-ide-store"
import { createDesktop } from "@/lib/desktop-client"
import { Monitor, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface DesktopLauncherProps {
  chatId: string
  projectId?: string
  iconOnly?: boolean
}

export function DesktopLauncher({
  chatId,
  projectId,
  iconOnly,
}: DesktopLauncherProps) {
  const [isLoading, setIsLoading] = useState(false)
  const desktop = useChatDesktop(chatId)
  const setChatDesktop = useIdeStore((s) => s.setChatDesktop)
  const setChatDesktopStatus = useIdeStore((s) => s.setChatDesktopStatus)
  const setViewMode = useIdeStore((s) => s.setViewMode)

  const handleLaunch = async () => {
    if (desktop?.sandboxId && desktop.vncUrl) {
      setViewMode("desktop")
      return
    }

    setIsLoading(true)
    setChatDesktopStatus(chatId, "starting")

    try {
      const { sandboxId, vncUrl } = await createDesktop(chatId, projectId)
      setChatDesktop(chatId, { sandboxId, vncUrl, status: "running" })
      setViewMode("desktop")
      toast.success("Desktop started")
    } catch (error) {
      setChatDesktopStatus(chatId, "error")

      let message = "Failed to start desktop"
      if (error instanceof Error) {
        if (error.message.includes("E2B_API_KEY")) {
          message = "Desktop feature not configured. Contact admin."
        } else if (error.message.includes("timeout")) {
          message = "Sandbox creation timed out. Try again."
        } else {
          message = error.message
        }
      }

      toast.error(message)
      console.error("Desktop launch error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const hasDesktop = Boolean(desktop?.sandboxId)

  return (
    <Button
      onClick={handleLaunch}
      disabled={isLoading}
      size={iconOnly ? "icon-xs" : "sm"}
      variant={iconOnly ? "ghost" : "outline"}
      title={hasDesktop ? "Open desktop" : "Launch desktop sandbox"}
    >
      {isLoading ? (
        <Loader2
          className={
            iconOnly ? "size-3.5 animate-spin" : "size-4 animate-spin"
          }
        />
      ) : (
        <Monitor className={iconOnly ? "size-3.5" : "size-4"} />
      )}
      {!iconOnly && (
        <>{isLoading ? "Starting..." : hasDesktop ? "Desktop" : "Launch Desktop"}</>
      )}
    </Button>
  )
}
