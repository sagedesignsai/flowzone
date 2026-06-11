import type { FilePartInput, TextPartInput } from "@opencode-ai/sdk/v2"
import type { UIMessage } from "ai"

type OpenCodePromptPart = TextPartInput | FilePartInput

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function normalizeBase64(value: string): string {
  return value.replace(/\s/g, "")
}

function filePartToOpenCode(part: Record<string, unknown>): FilePartInput | null {
  const mediaType =
    typeof part.mediaType === "string"
      ? part.mediaType
      : typeof part.mimeType === "string"
        ? part.mimeType
        : "application/octet-stream"

  const filename =
    typeof part.filename === "string"
      ? part.filename
      : typeof part.name === "string"
        ? part.name
        : undefined

  if (typeof part.url === "string") {
    return { type: "file", mime: mediaType, filename, url: part.url }
  }

  if (typeof part.data === "string") {
    const url = part.data.startsWith("data:")
      ? part.data
      : `data:${mediaType};base64,${normalizeBase64(part.data)}`
    return { type: "file", mime: mediaType, filename, url }
  }

  return null
}

export function convertUIMessageToOpenCodeParts(
  message: UIMessage | undefined,
): OpenCodePromptPart[] {
  if (!message?.parts) return []

  const parts: OpenCodePromptPart[] = []

  for (const part of message.parts) {
    if (!isRecord(part)) continue

    if (part.type === "text" && typeof part.text === "string") {
      parts.push({ type: "text", text: part.text })
      continue
    }

    if (part.type === "file") {
      const filePart = filePartToOpenCode(part)
      if (filePart) parts.push(filePart)
    }
  }

  return parts
}
