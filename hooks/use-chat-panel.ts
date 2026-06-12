"use client"

import { useChat } from "@ai-sdk/react"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input"
import { useChatTransport } from "@/components/chat/chat-transport"
import type { DesktopStatus } from "@/hooks/use-ide-store"
import { useIdeStore } from "@/hooks/use-ide-store"
import { buildMessagePayload } from "@/lib/chat/client/build-message-payload"
import type { UIMessage } from "ai"


// ─── Types ──────────────────────────────────────────────────────────────────


export interface UseChatPanelOptions {
  chatId: string
  initialMessages?: UIMessage[]
  projectId?: string
  desktopSandboxId?: string | null
  desktopReady?: boolean
  desktopStatus?: DesktopStatus
  desktopOptOut?: boolean
  apiPath?: string
}

export interface UseChatPanelReturn {
  messages: UIMessage[]
  inputText: string
  useWebSearch: boolean
  status: "submitted" | "streaming" | "ready" | "error"
  error: Error | undefined
  isLoading: boolean
  isStreaming: boolean
  isEmpty: boolean
  useLocalInference: boolean
  desktopLabel: { label: string; tone: "default" | "success" | "warning" | "muted" }
  capabilityLabel: string
  handlePromptSubmit: (message: PromptInputMessage) => void
  handleTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleCopyMessage: (text: string) => void
  handleTranscriptionChange: (transcript: string) => void
  toggleWebSearch: () => void
  onStop: () => void
  onRegenerate: () => void
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useChatPanel({
  chatId,
  initialMessages,
  projectId: projectIdProp,
  desktopSandboxId = null,
  desktopReady = true,
  desktopStatus = "idle",
  desktopOptOut = false,
  apiPath,
}: UseChatPanelOptions): UseChatPanelReturn {
  const searchParams = useSearchParams()
  const projectId =
    projectIdProp ?? searchParams.get("projectId") ?? undefined
  const environment = searchParams.get("env") ?? undefined

  const updateChatSession = useIdeStore((s) => s.updateChatSession)

  const hasSentInitialRef = useRef(false)
  const titleGeneratedRef = useRef(false)

  const [inputText, setInputText] = useState("")
  const [useWebSearch, setUseWebSearch] = useState(false)

  const { transport, useLocalInference } = useChatTransport(
    projectId,
    useWebSearch,
    environment,
    apiPath,
  )

  const { messages, sendMessage, error, stop, regenerate, status } =
    useChat<any>({
      id: chatId,
      messages: initialMessages,
      transport,
      experimental_throttle: 75,
      onError: (err) => {
        console.error("Chat error:", err)
      },
      onFinish: ({ messages: finishedMessages }) => {
        const assistantCount = finishedMessages.filter(
          (m) => m.role === "assistant",
        ).length
        if (!titleGeneratedRef.current && assistantCount <= 1) {
          titleGeneratedRef.current = true
          fetch(`/api/workspace/desktop/${chatId}/title`, { method: "POST" })
            .then(async (res) => {
              if (res.ok) {
                const { title } = await res.json()
                updateChatSession(chatId, { title })
              }
            })
            .catch((err) => {
              console.error("Failed to generate title:", err)
            })
        }
      },
    })

  const isLoading = status === "streaming" || status === "submitted"
  const isStreaming = isLoading
  const isEmpty = messages.length === 0

  // ── Derived labels ──────────────────────────────────────────────────────────

  const desktopLabel = useMemo(() => {
    if (desktopOptOut) return { label: "Desktop off", tone: "muted" as const }
    if (desktopStatus === "error") {
      return { label: "Desktop error", tone: "warning" as const }
    }
    if (desktopStatus === "starting") {
      return { label: "Desktop starting", tone: "warning" as const }
    }
    if (desktopStatus === "stopping") {
      return { label: "Desktop stopping", tone: "warning" as const }
    }
    if (desktopReady) return { label: "Desktop ready", tone: "success" as const }
    if (!desktopSandboxId) return { label: "Desktop pending", tone: "warning" as const }
    return { label: "Desktop starting", tone: "warning" as const }
  }, [desktopOptOut, desktopReady, desktopSandboxId, desktopStatus])

  const capabilityLabel = useMemo(() => {
    return useWebSearch ? "Web search on" : "Web search off"
  }, [useWebSearch])

  // ── Message submission ──────────────────────────────────────────────────────

  const submitUserMessage = useCallback(
    (text: string, files?: PromptInputMessage["files"]) => {
      const payload = buildMessagePayload({
        text,
        files,
        desktopSandboxId: desktopOptOut ? null : desktopSandboxId,
        chatId,
      })
      sendMessage(payload)
    },
    [sendMessage, desktopSandboxId, desktopOptOut, chatId],
  )

  const handlePromptSubmit = useCallback(
    (message: PromptInputMessage) => {
      const text = message.text
      if (!text.trim() && !message.files?.length) return

      setInputText("")
      submitUserMessage(text, message.files)
    },
    [submitUserMessage],
  )

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputText(e.target.value)
    },
    [],
  )

  const handleCopyMessage = useCallback(async (text: string) => {
    if (!text.trim()) {
      toast.info("No text to copy")
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied response")
    } catch {
      toast.error("Could not copy response")
    }
  }, [])

  const handleTranscriptionChange = useCallback((transcript: string) => {
    setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript))
  }, [])

  const toggleWebSearch = useCallback(() => {
    setUseWebSearch((p) => !p)
  }, [])

  // ── Auto-submit initial prompt from URL ──────────────────────────────────────

  const initialPrompt = searchParams.get("q")
  const canSendInitial =
    desktopOptOut ||
    desktopStatus === "running" ||
    desktopStatus === "error"

  useEffect(() => {
    if (
      initialPrompt &&
      !hasSentInitialRef.current &&
      status === "ready" &&
      messages.length === 0 &&
      canSendInitial
    ) {
      hasSentInitialRef.current = true
      submitUserMessage(initialPrompt)
    }
  }, [
    initialPrompt,
    submitUserMessage,
    status,
    messages.length,
    canSendInitial,
  ])

  // ── Return ───────────────────────────────────────────────────────────────────

  return {
    messages,
    inputText,
    useWebSearch,
    status,
    error,
    isLoading,
    isStreaming,
    isEmpty,
    useLocalInference,
    desktopLabel,
    capabilityLabel,
    handlePromptSubmit,
    handleTextChange,
    handleCopyMessage,
    handleTranscriptionChange,
    toggleWebSearch,
    onStop: stop,
    onRegenerate: regenerate,
  }
}
