"use client"

import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments"
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
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input"
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionAddScreenshot,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input"
import { SpeechInput } from "@/components/ai-elements/speech-input"
import { Button } from "@/components/ui/button"
import { useIdeStore } from "@/hooks/use-ide-store"
import { buildMessagePayload } from "@/lib/chat/client/build-message-payload"
import { cn } from "@/lib/utils"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import {
  ArrowClockwiseIcon as ArrowClockwise,
  SparkleIcon as Sparkle,
} from "@phosphor-icons/react"
import { GlobeIcon } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { SubmitEvent } from "react"

interface ChatPanelProps {
  chatId: string
  initialMessages?: UIMessage[]
  projectId?: string
  desktopSandboxId?: string | null
  desktopReady?: boolean
  desktopOptOut?: boolean
  className?: string
}

function EmptyState() {
  return (
    <ConversationEmptyState
      description="Describe what you want to build"
      icon={<Sparkle className="size-6" />}
      title="What should we build?"
    />
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
          Thinking...
        </span>
      </MessageContent>
    </Message>
  )
}

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

function ChatPromptSubmit({
  inputText,
  isStreaming,
  onStop,
  status,
}: {
  inputText: string
  isStreaming: boolean
  onStop: () => void
  status: "submitted" | "streaming" | "ready" | "error"
}) {
  const attachments = usePromptInputAttachments()
  const hasAttachments = attachments.files.length > 0

  return (
    <PromptInputSubmit
      disabled={(!inputText.trim() && !hasAttachments) && !isStreaming}
      onStop={onStop}
      status={status}
    />
  )
}

function ChatAttachmentPreviews() {
  const attachments = usePromptInputAttachments()

  if (attachments.files.length === 0) return null

  return (
    <PromptInputHeader>
      <Attachments variant="inline">
        {attachments.files.map((file) => (
          <Attachment
            key={file.id}
            data={file}
            onRemove={() => attachments.remove(file.id)}
          >
            <AttachmentPreview />
            <AttachmentRemove />
          </Attachment>
        ))}
      </Attachments>
    </PromptInputHeader>
  )
}

export function ChatPanel({
  chatId,
  initialMessages,
  projectId: projectIdProp,
  desktopSandboxId = null,
  desktopReady = true,
  desktopOptOut = false,
  className,
}: ChatPanelProps) {
  const searchParams = useSearchParams()
  const projectId =
    projectIdProp ?? searchParams.get("projectId") ?? undefined

  const updateChatSession = useIdeStore((s) => s.updateChatSession)

  const hasSentInitialRef = useRef(false)
  const titleGeneratedRef = useRef(false)

  const [inputText, setInputText] = useState("")
  const [useWebSearch, setUseWebSearch] = useState(false)
  const useWebSearchRef = useRef(useWebSearch)
  useWebSearchRef.current = useWebSearch

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        body: () => ({
          projectId,
          webSearch: useWebSearchRef.current,
        }),
      }),
    [projectId],
  )

  const { messages, sendMessage, error, stop, regenerate, status } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    onError: (err) => {
      console.error("Chat error:", err)
    },
    onFinish: ({ messages: finishedMessages }) => {
      const assistantCount = finishedMessages.filter(
        (m) => m.role === "assistant",
      ).length
      if (!titleGeneratedRef.current && assistantCount <= 1) {
        titleGeneratedRef.current = true
        fetch(`/api/chat/${chatId}/title`, { method: "POST" })
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

  const initialPrompt = searchParams.get("q")
  const canSendInitial =
    desktopOptOut ||
    desktopReady ||
    !desktopSandboxId

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

  const handlePromptSubmit = useCallback(
    (
      message: PromptInputMessage,
      _event: SubmitEvent<HTMLFormElement>,
    ) => {
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

  const handleTranscriptionChange = useCallback((transcript: string) => {
    setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript))
  }, [])

  const isEmpty = messages.length === 0
  const isStreaming = status === "streaming" || status === "submitted"

  return (
    <div
      className={cn(
        "flex size-full flex-col overflow-hidden bg-background",
        className,
      )}
    >
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
                  Thinking...
                </span>
              </MessageContent>
            </Message>
          )}

          {error && !isEmpty && (
            <div className="flex items-center justify-center py-4">
              <ErrorBanner error={error} onRetry={() => regenerate()} />
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {error && isEmpty && (
        <div className="px-3 pb-2">
          <ErrorBanner error={error} onRetry={() => regenerate()} />
        </div>
      )}

      <div className="w-full shrink-0 px-4 pb-4 pt-4">
        <PromptInput globalDrop multiple onSubmit={handlePromptSubmit}>
          <ChatAttachmentPreviews />
          <PromptInputBody>
            <PromptInputTextarea
              className="min-h-[60px]"
              disabled={isStreaming}
              onChange={handleTextChange}
              placeholder={
                isStreaming ? "Waiting for response…" : "Ask a follow-up…"
              }
              value={inputText}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                  <PromptInputActionAddScreenshot />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              <SpeechInput
                className="shrink-0"
                onTranscriptionChange={handleTranscriptionChange}
                size="icon-sm"
                variant="ghost"
              />

              <PromptInputButton
                onClick={() => setUseWebSearch((p) => !p)}
                variant={useWebSearch ? "default" : "ghost"}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
            </PromptInputTools>

            <ChatPromptSubmit
              inputText={inputText}
              isStreaming={isStreaming}
              onStop={stop}
              status={status}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}
