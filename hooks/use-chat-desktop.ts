"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  useChatDesktop,
  useIdeStore,
  type DesktopStatus,
} from "@/hooks/use-ide-store"
import { createDesktop, optOutDesktop } from "@/lib/desktop-client"

interface UseChatDesktopOptions {
  chatId: string
  projectId?: string
  desktopOptOut?: boolean
  skipAutoLaunch?: boolean
}

export function useChatDesktopManager({
  chatId,
  projectId,
  desktopOptOut = false,
  skipAutoLaunch = false,
}: UseChatDesktopOptions) {
  const desktop = useChatDesktop(chatId)
  const setChatDesktop = useIdeStore((s) => s.setChatDesktop)
  const setChatDesktopStatus = useIdeStore((s) => s.setChatDesktopStatus)
  const clearChatDesktop = useIdeStore((s) => s.clearChatDesktop)
  const setViewMode = useIdeStore((s) => s.setViewMode)

  const [error, setError] = useState<string | null>(null)
  const launchGeneration = useRef(0)
  const autoLaunchAttempted = useRef<string | null>(null)

  const status: DesktopStatus = desktop?.status ?? "idle"
  const sandboxId = desktop?.sandboxId ?? null
  const vncUrl = desktop?.vncUrl ?? null
  const isLaunching = status === "starting"
  const isReady = Boolean(sandboxId && vncUrl && status === "running")

  const launch = useCallback(async () => {
    if (desktopOptOut || skipAutoLaunch) return

    const generation = ++launchGeneration.current
    setError(null)
    setChatDesktopStatus(chatId, "starting")

    try {
      const { sandboxId: id, vncUrl: url } = await createDesktop(
        chatId,
        projectId,
      )
      if (generation !== launchGeneration.current) return

      setChatDesktop(chatId, {
        sandboxId: id,
        vncUrl: url,
        status: "running",
      })
      setViewMode("desktop")
    } catch (err) {
      if (generation !== launchGeneration.current) return
      setChatDesktopStatus(chatId, "error")
      setError(err instanceof Error ? err.message : "Desktop failed to start")
      throw err
    }
  }, [
    chatId,
    projectId,
    desktopOptOut,
    skipAutoLaunch,
    setChatDesktop,
    setChatDesktopStatus,
    setViewMode,
  ])

  const retry = useCallback(async () => {
    clearChatDesktop(chatId)
    await launch()
  }, [chatId, clearChatDesktop, launch])

  const optOut = useCallback(async () => {
    launchGeneration.current++
    await optOutDesktop(chatId)
    clearChatDesktop(chatId)
    setViewMode("preview")
    setError(null)
  }, [chatId, clearChatDesktop, setViewMode])

  useEffect(() => {
    if (desktopOptOut || skipAutoLaunch) return
    if (autoLaunchAttempted.current === chatId) return

    const existing = useIdeStore.getState().chatDesktops[chatId]
    if (existing?.status === "running" && existing.vncUrl) {
      setViewMode("desktop")
      autoLaunchAttempted.current = chatId
      return
    }

    autoLaunchAttempted.current = chatId
    launch().catch(() => {
      // error stored in state
    })
  }, [chatId, desktopOptOut, skipAutoLaunch, launch, setViewMode])

  useEffect(() => {
    return () => {
      autoLaunchAttempted.current = null
      launchGeneration.current++
    }
  }, [chatId])

  return {
    sandboxId,
    vncUrl,
    status,
    isLaunching,
    isReady,
    error,
    launch,
    retry,
    optOut,
  }
}
