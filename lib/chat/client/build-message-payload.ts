import type { FileUIPart } from "ai"
import { createDesktopSandboxAttachment } from "@/lib/desktop/constants"

export interface BuildMessagePayloadOptions {
  text: string
  files?: FileUIPart[]
  desktopSandboxId?: string | null
  chatId?: string
}

export type SendMessagePayload = {
  text: string
  files?: FileUIPart[]
  attachments?: ReturnType<typeof createDesktopSandboxAttachment>[]
}

/**
 * Build the payload for useChat sendMessage including files and desktop context.
 */
export function buildMessagePayload(
  options: BuildMessagePayloadOptions,
): SendMessagePayload {
  const { text, files, desktopSandboxId, chatId } = options
  const trimmed = text.trim()

  const payload: SendMessagePayload = { text: trimmed }

  if (files && files.length > 0) {
    payload.files = files
  }

  if (desktopSandboxId && chatId) {
    payload.attachments = [
      createDesktopSandboxAttachment(desktopSandboxId, chatId),
    ]
  }

  return payload
}
