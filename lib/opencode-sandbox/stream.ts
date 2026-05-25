/**
 * OpenCode to Vercel AI SDK Stream Converter
 *
 * Transforms OpenCode's AssistantMessage + Part[] response into
 * Vercel AI SDK UIMessage chunks compatible with useChat.
 *
 * The Vercel UI message stream protocol uses these chunk types:
 *   text-start, text-delta, text-end  — text content
 *   tool-input-start, tool-input-available — tool invocation input
 *   tool-output-available, tool-output-error — tool execution result
 *   reasoning-start, reasoning-delta, reasoning-end — reasoning blocks
 *   file — file attachments
 *   start, finish — message boundaries
 *   error — error events
 */

import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai"
import type {
  AssistantMessage,
  Part,
  TextPart,
  ReasoningPart,
  ToolPart,
  FilePart,
  ToolStateCompleted,
  ToolStateError,
} from "@opencode-ai/sdk"

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function writeTextPart(writer: { write: (chunk: Record<string, unknown>) => void }, part: TextPart): void {
  const id = part.id ?? generateId()
  writer.write({ type: "text-start", id })
  writer.write({ type: "text-delta", id, delta: part.text })
  writer.write({ type: "text-end", id })
}

function writeReasoningPart(
  writer: { write: (chunk: Record<string, unknown>) => void },
  part: ReasoningPart
): void {
  const id = part.id ?? generateId()
  writer.write({ type: "reasoning-start", id })
  writer.write({ type: "reasoning-delta", id, delta: part.text })
  writer.write({ type: "reasoning-end", id })
}

function writeToolPart(writer: { write: (chunk: Record<string, unknown>) => void }, part: ToolPart): void {
  const toolCallId = part.callID
  const toolName = part.tool

  writer.write({ type: "tool-input-start", toolCallId, toolName })

  const state = part.state

  if (state.status === "completed" || state.status === "running") {
    writer.write({
      type: "tool-input-available",
      toolCallId,
      toolName,
      input: state.input,
    })

    if (state.status === "completed") {
      const completed = state as ToolStateCompleted
      writer.write({
        type: "tool-output-available",
        toolCallId,
        output: completed.output,
      })
    }
  } else if (state.status === "error") {
    const errorState = state as ToolStateError
    writer.write({
      type: "tool-input-available",
      toolCallId,
      toolName,
      input: state.input,
    })
    writer.write({
      type: "tool-output-error",
      toolCallId,
      errorText: errorState.error,
    })
  } else if (state.status === "pending") {
    writer.write({
      type: "tool-input-available",
      toolCallId,
      toolName,
      input: state.input,
    })
  }
}

function writeFilePart(writer: { write: (chunk: Record<string, unknown>) => void }, part: FilePart): void {
  writer.write({
    type: "file",
    url: part.url,
    mediaType: part.mime,
  })
}

export interface OpenCodePromptResult {
  info: AssistantMessage
  parts: Part[]
}

export function createOpenCodeUIStreamResponse(
  result: OpenCodePromptResult,
  originalMessages: UIMessage[]
): Response {
  const stream = createUIMessageStream({
    execute: (writer) => {
      const messageId = result.info.id ?? generateId()

      writer.write({ type: "start", messageId })

      for (const part of result.parts) {
        switch (part.type) {
          case "text":
            writeTextPart(writer, part as TextPart)
            break
          case "reasoning":
            writeReasoningPart(writer, part as ReasoningPart)
            break
          case "tool":
            writeToolPart(writer, part as ToolPart)
            break
          case "file":
            writeFilePart(writer, part as FilePart)
            break
        }
      }

      writer.write({ type: "finish", finishReason: result.info.finish ?? "stop" })
    },
    originalMessages,
  })

  return createUIMessageStreamResponse({ stream })
}
