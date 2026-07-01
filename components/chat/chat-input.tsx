"use client"

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
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments"
import { SpeechInput } from "@/components/ai-elements/speech-input"
import { GlobeIcon } from "lucide-react"

// ─── Sub-components ──────────────────────────────────────────

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
      disabled={!inputText.trim() && !hasAttachments && !isStreaming}
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

// ─── Main Component ──────────────────────────────────────────

interface ChatInputProps {
  inputText: string
  isStreaming: boolean
  status: "submitted" | "streaming" | "ready" | "error"
  desktopOptOut: boolean
  desktopReady: boolean
  desktopSandboxId: string | null
  useWebSearch: boolean
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (message: PromptInputMessage) => void
  onStop: () => void
  onWebSearchToggle: () => void
  onTranscriptionChange: (transcript: string) => void
}

/**
 * Renders the input area: prompt input with attachments, speech,
 * web search toggle, and submit button.
 */
export function ChatInput({
  inputText,
  isStreaming,
  status,
  desktopOptOut,
  desktopReady,
  desktopSandboxId,
  useWebSearch,
  onTextChange,
  onSubmit,
  onStop,
  onWebSearchToggle,
  onTranscriptionChange,
}: ChatInputProps) {
  return (
    <div className="w-full shrink-0 border-t border-border/60 bg-background/95 px-4 pb-4 pt-3 backdrop-blur">
      {desktopOptOut ? null : desktopStatusNotice(desktopOptOut, desktopReady, desktopSandboxId)}

      <PromptInput
        className="rounded-2xl border border-border/70 bg-card/70 shadow-sm ring-1 ring-border/40 backdrop-blur"
        globalDrop
        multiple
        onSubmit={onSubmit}
      >
        <ChatAttachmentPreviews />
        <PromptInputBody>
          <PromptInputTextarea
            className="min-h-[84px] resize-none bg-transparent px-4 py-3 text-sm sm:min-h-[96px]"
            disabled={isStreaming}
            onChange={onTextChange}
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
                onTranscriptionChange={onTranscriptionChange}
                size="icon-sm"
                variant="ghost"
              />

              <PromptInputButton
                aria-pressed={useWebSearch}
                className="transition-all duration-200"
                onClick={onWebSearchToggle}
                variant={useWebSearch ? "default" : "ghost"}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
            </PromptInputTools>

            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">
                Shift+Enter for new line
              </p>

              <ChatPromptSubmit
                inputText={inputText}
                isStreaming={isStreaming}
                onStop={onStop}
                status={status}
              />
            </div>
          </div>
        </PromptInputFooter>
      </PromptInput>
    </div>
  )
}

/** Desktop status notice banner shown during sandbox startup. */
function desktopStatusNotice(
  desktopOptOut: boolean,
  desktopReady: boolean,
  desktopSandboxId: string | null,
) {
  if (desktopOptOut) return null
  if (
    desktopReady === false &&
    desktopSandboxId
  ) {
    return (
      <div className="mb-2 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-400">
        Desktop is starting. Text and web search still work.
      </div>
    )
  }
  return null
}
