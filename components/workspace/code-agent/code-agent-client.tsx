"use client"

import { useChat } from "@ai-sdk/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { GlobalHeader } from "@/components/layout/global-header"
import { Button } from "@/components/ui/button"
import { useIdeStore } from "@/hooks/use-ide-store"
import { cn } from "@/lib/utils"
import type { UIMessage } from "ai"
import { DefaultChatTransport } from "ai"
import { PaperPlaneRight, StopCircle } from "@phosphor-icons/react"

interface CodeAgentPageClientProps {
  chatId: string
  initialMessages: UIMessage[]
  projectId?: string
  title: string
}

/**
 * Code Agent Chat Client
 *
 * Routes messages to the OpenCode-powered agent running inside an E2B
 * sandbox. The sandbox handles all tool execution (read, write, grep,
 * glob, bash, etc.) natively.
 *
 * The API endpoint /api/workspace/code-agent creates the sandbox, starts
 * the OpenCode headless server, and streams responses back as SSE.
 */
export function CodeAgentPageClient({
  chatId,
  initialMessages,
  projectId,
  title,
}: CodeAgentPageClientProps) {
  const setActiveChatId = useIdeStore((s) => s.setActiveChatId)
  const addChatSession = useIdeStore((s) => s.addChatSession)

  useEffect(() => {
    setActiveChatId(chatId)
    addChatSession({
      id: chatId,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      projectId: projectId ?? null,
    })
  }, [chatId, title, projectId, setActiveChatId, addChatSession])

  const {
    messages,
    status,
    error,
    stop,
    sendMessage,
    regenerate,
  } = useChat({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/workspace/code-agent",
      body: { projectId },
    }),
  })

  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isStreaming = status === "streaming" || status === "submitted"

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      setInput(e.target.value)
    },
    [],
  )

  const handleSubmit = useCallback(
    (e?: { preventDefault?: () => void }) => {
      e?.preventDefault?.()
      if (!input.trim() || isStreaming) return
      sendMessage({ text: input })
      setInput("")
    },
    // `sendMessage` and `isStreaming` from useChat are stable references
    [input, sendMessage, isStreaming],
  )
  const isEmpty = messages.length === 0
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    }
  }, [input])

  return (
    <div className="flex flex-col overflow-hidden">
      <GlobalHeader
        breadcrumb={title}
        showActions
        chatId={chatId}
      />

      {/* ── Messages area ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md text-center">
              <p className="text-sm text-muted-foreground">
                Code Agent is ready. Describe a development task and it will
                be executed directly inside a secure E2B sandbox.
              </p>
            </div>
          </div>
        )}

        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Error banner ──────────────────────────────────── */}
      {error && !isStreaming && (
        <div className="border-t border-destructive/20 bg-destructive/5 px-4 py-2">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <p className="text-xs text-destructive">
              {error.message ?? "An error occurred"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => regenerate()}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* ── Input area ────────────────────────────────────── */}
      <div className="border-t border-border p-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder={
                isStreaming
                  ? "Waiting for response…"
                  : "Describe a development task…"
              }
              rows={1}
              disabled={isStreaming}
              className={cn(
                "w-full resize-none rounded-xl border border-border bg-card px-4 py-3 pr-12",
                "text-sm placeholder:text-muted-foreground/50",
                "focus:outline-none focus:ring-1 focus:ring-ring",
                "disabled:opacity-50",
              )}
            />
            <div className="absolute bottom-2 right-2">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stop}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Stop"
                >
                  <StopCircle className="size-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                  title="Send"
                >
                  <PaperPlaneRight className="size-5" />
                </button>
              )}
            </div>
          </div>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-muted-foreground/40">
          Powered by OpenCode — all agent logic and tools run inside an E2B sandbox
        </p>
      </div>
    </div>
  )
}

// ─── Chat Bubble ─────────────────────────────────────────────

function ChatBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user"
  const text = message.parts
    ?.filter((p) => p.type === "text")
    .map((p) => (p as { text: string }).text ?? "")
    .join("")

  const reasoning = message.parts
    ?.filter((p) => p.type === "reasoning")
    .map((p) => (p as { text: string }).text ?? "")
    .join("")

  const toolOutputs = message.parts?.filter(
    (p) =>
      p.type === "dynamic-tool" &&
      (p as { state: string }).state === "output-available",
  )

  const toolErrors = message.parts?.filter(
    (p) =>
      p.type === "dynamic-tool" &&
      (p as { state: string }).state === "output-error",
  )

  const fileParts = message.parts?.filter((p) => p.type === "file")

  const hasContent = text || reasoning || toolOutputs?.length || toolErrors?.length || fileParts?.length
  if (!hasContent) return null

  function formatOutput(output: unknown): string {
    if (typeof output === "string") return output
    try {
      return JSON.stringify(output, null, 2)
    } catch {
      return String(output)
    }
  }

  return (
    <div
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[80%] space-y-2 rounded-2xl px-4 py-2.5",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        {reasoning && (
          <details className="mb-1">
            <summary className="cursor-pointer text-[11px] text-muted-foreground/60 hover:text-muted-foreground">
              Reasoning
            </summary>
            <pre className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground/80">
              {reasoning}
            </pre>
          </details>
        )}

        {text && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
        )}

        {toolOutputs?.map((tool) => {
          const t = tool as Record<string, unknown>
          return (
          <div
            key={`${t.toolName as string}-${t.toolCallId as string}`}
            className="overflow-hidden rounded-lg border border-border/50"
          >
            <div className="border-b border-border/30 bg-muted/50 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
              {t.toolName as string}
            </div>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all bg-card/50 p-3 text-xs leading-relaxed">
              {formatOutput(t.output)}
            </pre>
          </div>
          )
        })}

        {toolErrors?.map((tool) => {
          const t = tool as Record<string, unknown>
          return (
          <div
            key={`error-${t.toolCallId as string}`}
            className="overflow-hidden rounded-lg border border-destructive/30"
          >
            <div className="border-b border-destructive/20 bg-destructive/10 px-3 py-1.5 text-[11px] font-medium text-destructive">
              {t.toolName as string} — Error
            </div>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all bg-card/50 p-3 text-xs text-destructive/90">
              {t.errorText as string}
            </pre>
          </div>
          )
        })}

        {fileParts?.map((file) => {
          const f = file as Record<string, unknown>
          return (
          <div
            key={f.url as string}
            className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2 text-xs text-muted-foreground"
          >
            <span className="truncate">{(f.filename as string) ?? (f.url as string).split("/").pop() ?? "file"}</span>
            <span className="shrink-0 text-[10px] opacity-50">{f.mediaType as string}</span>
          </div>
          )
        })}
      </div>
    </div>
  )
}
