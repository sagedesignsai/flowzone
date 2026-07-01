"use client"

import { ChatHeader } from "@/components/chat/chat-header"
import { ChatInput } from "@/components/chat/chat-input"
import { ErrorBanner, ChatMessages } from "@/components/chat/chat-messages"
import type { DesktopStatus } from "@/hooks/use-ide-store"
import { useChatPanel } from "@/hooks/use-chat-panel"
import { cn } from "@/lib/utils"
import type { UIMessage } from "ai"
import { useEffect, useRef } from "react"

interface ChatPanelProps {
  chatId: string
  initialMessages?: UIMessage[]
  projectId?: string
  desktopSandboxId?: string | null
  desktopReady?: boolean
  desktopStatus?: DesktopStatus
  desktopOptOut?: boolean
  apiPath?: string
  className?: string
  /** When false, the auto-submit of the initial URL prompt is suppressed. */
  initReady?: boolean
}

export function ChatPanel({
  chatId,
  initialMessages,
  projectId,
  desktopSandboxId = null,
  desktopReady = true,
  desktopStatus = "idle",
  desktopOptOut = false,
  apiPath,
  className,
  initReady = true,
}: ChatPanelProps) {
  const {
    messages,
    inputText,
    useWebSearch,
    status,
    error,
    isEmpty,
    isStreaming,
    useLocalInference,
    desktopLabel,
    capabilityLabel,
    handlePromptSubmit,
    handleTextChange,
    handleCopyMessage,
    handleTranscriptionChange,
    toggleWebSearch,
    onStop,
    onRegenerate,
  } = useChatPanel({
    chatId,
    initialMessages,
    projectId,
    desktopSandboxId,
    desktopReady,
    desktopStatus,
    desktopOptOut,
    apiPath,
    initReady,
  })

  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        // Focus the textarea inside PromptInput
        const textarea = document.querySelector<HTMLTextAreaElement>(
          'textarea[name="message"]'
        )
        textarea?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div
      className={cn(
        "flex size-full flex-col overflow-hidden bg-background",
        className,
      )}
    >
      <ChatHeader
        projectId={projectId}
        desktopLabel={desktopLabel}
        capabilityLabel={capabilityLabel}
        useWebSearch={useWebSearch}
        useLocalInference={useLocalInference}
      />

      <ChatMessages
        messages={messages}
        isEmpty={isEmpty}
        isLoading={isStreaming}
        isStreaming={isStreaming}
        error={error}
        onCopyMessage={handleCopyMessage}
        onRegenerate={onRegenerate}
      />

      {error && isEmpty && (
        <div className="px-3 pb-2">
          <ErrorBanner error={error} onRetry={() => onRegenerate()} />
        </div>
      )}

      <ChatInput
        inputText={inputText}
        isStreaming={isStreaming}
        status={status}
        desktopOptOut={desktopOptOut}
        desktopReady={desktopReady}
        desktopSandboxId={desktopSandboxId}
        useWebSearch={useWebSearch}
        onTextChange={handleTextChange}
        onSubmit={handlePromptSubmit}
        onStop={onStop}
        onWebSearchToggle={toggleWebSearch}
        onTranscriptionChange={handleTranscriptionChange}
      />
    </div>
  )
}
