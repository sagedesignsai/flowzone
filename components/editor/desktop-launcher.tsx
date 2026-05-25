"use client"

/**
 * Desktop Launcher
 *
 * Button to launch a desktop sandbox with loading state and error handling.
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useIdeStore } from "@/hooks/use-ide-store"
import { createDesktop } from "@/lib/desktop-client"
import { Monitor, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface DesktopLauncherProps {
  chatId: string
  projectId?: string
  iconOnly?: boolean
}

export function DesktopLauncher({ chatId, projectId, iconOnly }: DesktopLauncherProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { desktopSandboxId, setDesktopSandbox, setDesktopStatus, setViewMode } =
    useIdeStore()

  const handleLaunch = async () => {
    if (desktopSandboxId) {
      setViewMode("desktop")
      return
    }

    setIsLoading(true)
    setDesktopStatus("starting")

    try {
      const { sandboxId, vncUrl } = await createDesktop(chatId, projectId)
      setDesktopSandbox(sandboxId, vncUrl)
      setViewMode("desktop")
      toast.success("Desktop started")
    } catch (error) {
      setDesktopStatus("error")

      // Provide specific error messages
      let message = "Failed to start desktop"
      if (error instanceof Error) {
        if (error.message.includes("E2B_API_KEY")) {
          message = "Desktop feature not configured. Contact admin."
        } else if (error.message.includes("timeout")) {
          message = "Sandbox creation timed out. Try again."
        } else if (error.message.includes("VNC")) {
          message = "Failed to connect to desktop stream."
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

  return (
    <Button
      onClick={handleLaunch}
      disabled={isLoading}
      size={iconOnly ? "icon-xs" : "sm"}
      variant={iconOnly ? "ghost" : "outline"}
      title={desktopSandboxId ? "Open desktop" : "Launch desktop sandbox"}
    >
      {isLoading ? (
        <Loader2 className={iconOnly ? "size-3.5 animate-spin" : "size-4 animate-spin"} />
      ) : (
        <Monitor className={iconOnly ? "size-3.5" : "size-4"} />
      )}
      {!iconOnly && (
        <>
          {isLoading ? (
            <>Starting...</>
          ) : (
            <>{desktopSandboxId ? "Desktop" : "Launch Desktop"}</>
          )}
        </>
      )}
    </Button>
  )
}
