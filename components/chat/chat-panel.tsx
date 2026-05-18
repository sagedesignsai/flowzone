"use client"

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageActions,
  MessageAction,
  MessageContent,
} from "@/components/ai-elements/message"
import { MessageParts } from "@/components/chat/message-parts"
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionAddScreenshot,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input"
import { Button } from "@/components/ui/button"
import { useIdeStore } from "@/hooks/use-ide-store"
import { cn } from "@/lib/utils"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import {
  ArrowClockwiseIcon as ArrowClockwise,
  SparkleIcon as Sparkle,
  StopCircleIcon as StopCircle
} from "@phosphor-icons/react"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"
import type { SubmitEvent } from "react"

// ─── Props ──────────────────────────────────────────────────

interface ChatPanelProps {
  chatId: string
  className?: string
}

// ─── Empty State ─────────────────────────────────────────────

function EmptyState() {
  return (
    <ConversationEmptyState
      description="Describe what you want to build"
      icon={<Sparkle className="size-6" />}
      title="What should we build?"
    />
  )
}

// ─── Loading Indicator ───────────────────────────────────────

function StreamingIndicator() {
  return (
    <Message from="assistant">
      <MessageContent>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="flex gap-0.5">
            <span className="size-1.5 animate-bounce rounded-full bg-current" />
            <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:0.1s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:0.2s]" />
          </span>
          Thinking...
        </span>
      </MessageContent>
    </Message>
  )
}

// ─── Error Banner ────────────────────────────────────────────

function ErrorBanner({
  error,
  onRetry,
}: {
  error: Error
  onRetry: () => void
}) {
  return (
    <div className="mx-3 mb-2 flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
      <span className="flex-1">{error.message}</span>
      <Button
        onClick={onRetry}
        size="icon-xs"
        title="Retry"
        type="button"
        variant="ghost"
      >
        <ArrowClockwise className="size-3.5" />
      </Button>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────

export function ChatPanel({ chatId, className }: ChatPanelProps) {
  const searchParams = useSearchParams()
  const { updateChatSession } = useIdeStore()

  // Guard against React Strict Mode double-fire
  const hasSentInitialRef = useRef(false)

  const {
    messages,
    sendMessage,
    error,
    stop,
    regenerate,
    status,
  } = useChat({
    id: chatId,
    transport: new DefaultChatTransport(),
    onError: (err) => {
      console.error("Chat error:", err)
    },
    onFinish: (event) => {
      // Update chat title from first assistant response
      const textPart = event.message.parts.find(
        (p): p is { type: "text"; text: string } => p.type === "text",
      )
      if (textPart) {
        const firstLine = textPart.text
          .split("\n")
          .find((l) => l.trim().length > 0)
        if (firstLine) {
          updateChatSession(chatId, { title: firstLine.slice(0, 60) })
        }
      }
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  // ── Auto-send initial prompt from URL search params ───────
  const initialPrompt = searchParams.get("q")

  useEffect(() => {
    if (
      initialPrompt &&
      !hasSentInitialRef.current &&
      status === "ready" &&
      messages.length === 0
    ) {
      hasSentInitialRef.current = true
      sendMessage({ text: initialPrompt })
    }
  }, [initialPrompt, sendMessage, status, messages.length])

  // ── Handle PromptInput submit ─────────────────────────────
  const handlePromptSubmit = useCallback(
    (
      _message: { text: string; files?: import("ai").FileUIPart[] },
      _event: SubmitEvent<HTMLFormElement>,
    ) => {
      const text = _message.text
      if (!text.trim() || isLoading) return

      sendMessage({ text: text.trim() })
    },
    [isLoading, sendMessage],
  )

  // ── Render ────────────────────────────────────────────────
  const isEmpty = messages.length === 0
  const isStreaming = status === "streaming" || status === "submitted"

  return (
    <PromptInputProvider>
      <div
        className={cn(
          "flex size-full flex-col overflow-hidden bg-background",
          className,
        )}
      >
        {/* ── Messages ────────────────────────────────────── */}
        <Conversation className="flex-1">
          <ConversationContent>
            {isEmpty && !isLoading ? (
              <EmptyState />
            ) : (
              messages.map((msg) => (
                <Message key={msg.id} from={msg.role}>
                  <MessageContent>
                    <MessageParts parts={msg.parts} />
                  </MessageContent>
                  <MessageActions>
                    {msg.role === "assistant" && (
                      <MessageAction
                        onClick={() => {
                          const text = msg.parts
                            .filter((p) => p.type === "text")
                            .map((p) => (p as { text: string }).text)
                            .join("")
                          navigator.clipboard.writeText(text)
                        }}
                        size="icon-xs"
                        tooltip="Copy"
                        variant="ghost"
                      >
                        <span className="text-[10px]">📋</span>
                      </MessageAction>
                    )}
                  </MessageActions>
                </Message>
              ))
            )}

            {/* Streaming indicator — show when AI is thinking */}
            {isStreaming && !isEmpty && <StreamingIndicator />}

            {/* Loading the very first response */}
            {isEmpty && isLoading && (
              <Message from="assistant">
                <MessageContent>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <span className="flex gap-0.5">
                      <span className="size-1.5 animate-bounce rounded-full bg-current" />
                      <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:0.1s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:0.2s]" />
                    </span>
                    Thinking...
                  </span>
                </MessageContent>
              </Message>
            )}

            {/* Inline error with retry */}
            {error && !isEmpty && (
              <div className="flex items-center justify-center py-4">
                <ErrorBanner error={error} onRetry={() => regenerate()} />
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* ── Error Banner (above input) ──────────────────── */}
        {error && isEmpty && (
          <div className="px-3 pb-2">
            <ErrorBanner error={error} onRetry={() => regenerate()} />
          </div>
        )}

        {/* ── Prompt Input ────────────────────────────────── */}
        <div className="shrink-0 border-t border-border p-3">
          <PromptInput onSubmit={handlePromptSubmit}>
            <PromptInputTextarea
              className="min-h-[60px]"
              disabled={isStreaming}
              placeholder={
                isStreaming
                  ? "Waiting for response…"
                  : "Ask a follow-up…"
              }
            />

            <PromptInputFooter>
              {/* Left side: attachments */}
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                  <PromptInputActionAddScreenshot />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              {/* Right side: stop / submit */}
              <div className="flex items-center gap-1">
                {isStreaming ? (
                  <Button
                    className="gap-1.5 text-xs"
                    onClick={stop}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    <StopCircle className="size-3.5" />
                    Stop
                  </Button>
                ) : (
                  <PromptInputSubmit />
                )}
              </div>
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </PromptInputProvider>
  )
}
