"use client"

import { ArrowClockwiseIcon as ArrowClockwise, SparkleIcon as Sparkle } from "@phosphor-icons/react"
import { CopyIcon } from "lucide-react"
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
      icon={<Sparkle className="size-5" />}
      title="What should we build?"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="max-w-sm space-y-1 text-center">
          <p className="text-xs text-muted-foreground">
            Describe the change, drop a screenshot, or ask for a code review.
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
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-12 animate-pulse rounded-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/60">
            <span className="flex gap-0.5">
              <span className="size-1 animate-bounce rounded-full bg-current" />
              <span className="size-1 animate-bounce rounded-full bg-current [animation-delay:0.1s]" />
              <span className="size-1 animate-bounce rounded-full bg-current [animation-delay:0.2s]" />
            </span>
            Working…
          </span>
        </div>
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
    <details className="rounded-lg border border-destructive/15 bg-destructive/[0.03]">
      <summary className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-xs text-destructive/80">
        <span className="flex-1 truncate">{error.message}</span>
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onRetry()
          }}
          size="icon-xs"
          title="Retry"
          type="button"
          variant="ghost"
        >
          <ArrowClockwise className="size-3" />
        </Button>
      </summary>
      <div className="border-t border-destructive/10 px-2.5 py-1.5">
        <pre className="max-h-24 overflow-auto text-[10px] text-destructive/60">
          {error.stack ?? error.message}
        </pre>
      </div>
    </details>
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
        className="gap-2 px-3 py-2"
        scrollClassName="scroll-smooth"
      >
        {isEmpty && !isLoading ? (
          <div className="flex h-full min-h-[14rem] flex-col justify-center sm:min-h-[18rem]">
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
                    <CopyIcon className="size-3.5" />
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
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-12 animate-pulse rounded-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/60">
                  <span className="flex gap-0.5">
                    <span className="size-1 animate-bounce rounded-full bg-current" />
                    <span className="size-1 animate-bounce rounded-full bg-current [animation-delay:0.1s]" />
                    <span className="size-1 animate-bounce rounded-full bg-current [animation-delay:0.2s]" />
                  </span>
                  Working…
                </span>
              </div>
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
