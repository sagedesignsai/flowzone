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
      size="icon-xs"
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
    <div className="w-full shrink-0 px-3 pb-3 pt-1">
      {desktopOptOut ? null : desktopStatusNotice(desktopOptOut, desktopReady, desktopSandboxId)}

      <PromptInput
        className="rounded-xl border border-border/50 bg-card/90 shadow-xs backdrop-blur-sm"
        globalDrop
        multiple
        onSubmit={onSubmit}
      >
        <ChatAttachmentPreviews />
        <PromptInputBody>
          <PromptInputTextarea
            className="min-h-[44px] resize-none bg-transparent px-3 py-2.5 text-sm"
            disabled={isStreaming}
            onChange={onTextChange}
            placeholder={
              isStreaming
                ? "Waiting for response…"
                : "Ask a follow-up…"
            }
            value={inputText}
          />
        </PromptInputBody>
        <PromptInputFooter className="px-2 pb-2 pt-0">
          <div className="flex w-full items-center justify-between gap-1">
            <PromptInputTools className="flex items-center gap-0.5">
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger tooltip="Add files" variant="ghost" size="icon-xs" />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                  <PromptInputActionAddScreenshot />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              <SpeechInput
                className="shrink-0"
                onTranscriptionChange={onTranscriptionChange}
                size="icon-xs"
                variant="ghost"
              />

              <PromptInputButton
                aria-pressed={useWebSearch}
                className="transition-all duration-200"
                onClick={onWebSearchToggle}
                size="icon-xs"
                variant={useWebSearch ? "default" : "ghost"}
              >
                <GlobeIcon size={14} />
              </PromptInputButton>
            </PromptInputTools>

            <div className="flex items-center gap-1">
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
      <div className="mb-1.5 rounded-md border border-amber-500/15 bg-amber-500/[0.04] px-2 py-0.5 text-[10px] text-amber-400/80">
        Desktop is starting. Text and web search still work.
      </div>
    )
  }
  return null
}
