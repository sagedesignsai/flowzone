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
import type { DesktopStatus } from "@/hooks/use-ide-store"
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
import { toast } from "sonner"

interface ChatPanelProps {
  chatId: string
  initialMessages?: UIMessage[]
  projectId?: string
  desktopSandboxId?: string | null
  desktopReady?: boolean
  desktopStatus?: DesktopStatus
  desktopOptOut?: boolean
  className?: string
}

function EmptyState() {
  return (
    <ConversationEmptyState icon={<Sparkle className="size-6" />} title="What should we build?">
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

function ErrorBanner({
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

function StatusPill({
  label,
  active = false,
  tone = "default",
}: {
  label: string
  active?: boolean
  tone?: "default" | "success" | "warning" | "muted"
}) {
  const toneClasses = {
    default: "border-border/70 bg-muted/40 text-muted-foreground",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    muted: "border-border/70 bg-background text-muted-foreground",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] leading-none tracking-wide",
        active && "shadow-sm",
        toneClasses[tone],
      )}
    >
      <span className={cn("size-1.5 rounded-full", active ? "bg-current" : "bg-current/50")} />
      {label}
    </span>
  )
}

function QuickPrompt({
  onClick,
  prompt,
}: {
  onClick: (prompt: string) => void
  prompt: string
}) {
  return (
    <button
      className={cn(
        "rounded-full border border-border/70 bg-background px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 hover:text-foreground",
      )}
      onClick={() => onClick(prompt)}
      type="button"
    >
      {prompt}
    </button>
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
  desktopStatus = "idle",
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

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        body: () => ({
          projectId,
          webSearch: useWebSearch,
        }),
      }),
    [projectId, useWebSearch],
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

  const quickPrompts = useMemo(
    () => [
      "Inspect the current issue and suggest the cleanest fix",
      "Refine this chat panel to feel more like v0.ai",
      "Summarize the latest tool output and next steps",
    ],
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
      <div className="flex items-start justify-between gap-4 border-b border-border/60 px-4 py-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Chat
            </span>
            {projectId && <StatusPill label="Project context" />}
            <StatusPill label={desktopLabel.label} tone={desktopLabel.tone} />
          </div>
          <p className="max-w-xl text-xs text-muted-foreground">
            Describe the change, inspect tool output, and keep moving with a minimal, focused thread.
          </p>
        </div>

        <StatusPill active={useWebSearch} label={capabilityLabel} tone={useWebSearch ? "success" : "default"} />
      </div>

      <Conversation className="flex-1">
        <ConversationContent
          className="gap-4 px-4 py-4 sm:gap-5 sm:px-5"
          scrollClassName="scroll-smooth"
        >
          {isEmpty && !isLoading ? (
            <div className="flex h-full min-h-[22rem] flex-col justify-center sm:min-h-[28rem]">
              <EmptyState />
              <div className="mt-6 grid gap-2 sm:grid-cols-3">
                {quickPrompts.map((prompt) => (
                  <QuickPrompt key={prompt} onClick={setInputText} prompt={prompt} />
                ))}
              </div>
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
                        void handleCopyMessage(text)
                      }}
                      size="icon-xs"
                      tooltip="Copy response"
                      variant="ghost"
                    >
                      <span className="text-[10px]">⧉</span>
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
                  Working…
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

      <div className="w-full shrink-0 border-t border-border/60 bg-background/95 px-4 pb-4 pt-3 backdrop-blur">
        {desktopOptOut ? null : desktopStatus === "starting" ||
          (!desktopReady && desktopSandboxId) ? (
          <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            Desktop is starting. Text and web search still work while the workspace connects.
          </div>
        ) : null}

        <PromptInput
          className="rounded-2xl border border-border/70 bg-card/70 shadow-sm ring-1 ring-border/40 backdrop-blur"
          globalDrop
          multiple
          onSubmit={handlePromptSubmit}
        >
          <ChatAttachmentPreviews />
          <PromptInputBody>
            <PromptInputTextarea
              className="min-h-[84px] resize-none bg-transparent px-4 py-3 text-sm sm:min-h-[96px]"
              disabled={isStreaming}
              onChange={handleTextChange}
              placeholder={
                isStreaming
                  ? "Waiting for response…"
                  : desktopOptOut
                    ? "Ask a follow-up or describe a task…"
                    : desktopReady
                      ? "Ask a follow-up or describe a task…"
                      : "Ask a follow-up while the desktop connects…"
              }
              value={inputText}
            />
          </PromptInputBody>
          <PromptInputFooter className="px-3 pb-3 pt-2">
            <div className="flex w-full flex-col gap-2">
              <PromptInputTools className="flex-wrap gap-2">
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger tooltip="Add tools" variant="outline" />
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
                  aria-pressed={useWebSearch}
                  onClick={() => setUseWebSearch((p) => !p)}
                  variant={useWebSearch ? "default" : "ghost"}
                >
                  <GlobeIcon size={16} />
                  <span>Search</span>
                </PromptInputButton>
              </PromptInputTools>

              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-muted-foreground">
                  Shift+Enter for a new line. Attach files, screenshots, or speak to draft faster.
                </p>

                <ChatPromptSubmit
                  inputText={inputText}
                  isStreaming={isStreaming}
                  onStop={stop}
                  status={status}
                />
              </div>
            </div>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}
