"use client"

import { ArrowClockwiseIcon as ArrowClockwise, SparkleIcon as Sparkle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"
import type { UIMessage } from "ai"
import { useCallback } from "react"
import { toast } from "sonner"
import { ModelDownloadProgress } from "./model-download-progress"

// ─── Sub-components ──────────────────────────────────────────

function EmptyState() {
  return (
    <ConversationEmptyState
      icon={<Sparkle className="size-6" />}
      title="What should we build?"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="max-w-sm space-y-1 text-center">
          <p className="text-sm text-muted-foreground">
            Describe the change, drop a screenshot, or ask for a code review.
          </p>
          <p className="text-xs text-muted-foreground/80">
            Attach files, use web search, or let the desktop sandbox verify the result.
          </p>
        </div>
      </div>
    </ConversationEmptyState>
  )
}

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
          Working…
        </span>
      </MessageContent>
    </Message>
  )
}

export function ErrorBanner({
  error,
  onRetry,
}: {
  error: Error
  onRetry: () => void
}) {
  return (
    <div className="mx-3 mb-2 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive shadow-sm">
      <span className="flex-1 truncate">{error.message}</span>
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

// ─── Message List ────────────────────────────────────────────────────────────

interface ChatMessagesProps {
  messages: UIMessage[]
  isEmpty: boolean
  isLoading: boolean
  isStreaming: boolean
  error: Error | undefined | null
  onCopyMessage: (text: string) => void
  onRegenerate: () => void
}

/**
 * Renders the conversation area: messages, empty state, streaming indicator,
 * error banners, and quick prompts.
 */
export function ChatMessages({
  messages,
  isEmpty,
  isLoading,
  isStreaming,
  error,
  onCopyMessage,
  onRegenerate,
}: ChatMessagesProps) {
  return (
    <Conversation className="flex-1">
      <ConversationContent
        className="gap-4 px-4 py-4 sm:gap-5 sm:px-5"
        scrollClassName="scroll-smooth"
      >
        {isEmpty && !isLoading ? (
          <div className="flex h-full min-h-[22rem] flex-col justify-center sm:min-h-[28rem]">
            <EmptyState />
          </div>
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
                      onCopyMessage(text)
                    }}
                    size="icon-xs"
                    tooltip="Copy response"
                    variant="ghost"
                  >
                    <span className="text-[10px]">⧉</span>
                  </MessageAction>
                )}
              </MessageActions>
              {msg.parts.map((part, i) => {
                if (part.type === "data-modelDownloadProgress") {
                  const data = (part as any).data
                  return (
                    <ModelDownloadProgress
                      key={i}
                      message={data.message}
                      status={data.status}
                      progress={data.progress}
                    />
                  )
                }
                return null
              })}
            </Message>
          ))
        )}

        {isStreaming && !isEmpty && <StreamingIndicator />}

        {isEmpty && isLoading && (
          <Message from="assistant">
            <MessageContent>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="flex gap-0.5">
                  <span className="size-1.5 animate-bounce rounded-full bg-current" />
                  <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:0.1s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:0.2s]" />
                </span>
                Working…
              </span>
            </MessageContent>
          </Message>
        )}

        {error && !isEmpty && (
          <div className="flex items-center justify-center py-4">
            <ErrorBanner error={error} onRetry={() => onRegenerate()} />
          </div>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  )
}
