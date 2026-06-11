/**
 * Real-time streaming prompt for OpenCode.
 *
 * Subscribes to OpenCode events and calls promptAsync (non-blocking),
 * then maps the event stream → standard AI SDK UIMessageChunks via
 * OpenCodeUIStreamConverter.
 */

import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
  type UIMessageChunk,
  type UIMessageStreamWriter,
} from "ai"
import type { OpencodeClient } from "@opencode-ai/sdk/v2"
import type { Part } from "@opencode-ai/sdk/v2"
import { logger } from "@/lib/logger"
import { withTimeout } from "@/lib/retry"
import {
  OpenCodeUIStreamConverter,
  unwrapOpenCodeEvent,
  getOpenCodeEventSessionId,
  isOpenCodeSessionComplete,
} from "@/lib/opencode-sandbox/event-converter"
import {
  getPermissionRequestInfo,
  approveOpenCodePermission,
  rejectOpenCodeQuestion,
} from "@/lib/opencode-sandbox/permissions"
import { convertUIMessageToOpenCodeParts } from "@/lib/opencode-sandbox/input-parts"

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const EVENT_IDLE_TIMEOUT_MS = 120_000 // 2 min without events → assume done
const PROMPT_TIMEOUT_MS = 300_000 // 5 min overall timeout

export interface StreamOpenCodeOptions {
  client: OpencodeClient
  sessionId: string
  /** Latest user UIMessage — converted to OpenCode parts for the prompt */
  userMessage?: UIMessage
  /** Fallback plain text if userMessage is absent */
  promptText?: string
  originalMessages: UIMessage[]
  abortSignal?: AbortSignal
  directory?: string
  model?: { providerID: string; modelID: string }
  agent?: string
  onFinish?: (message: { id: string; parts: Part[] }) => void | Promise<void>
}

/**
 * Execute an OpenCode prompt and write standard AI SDK chunks to the writer.
 *
 * Architecture:
 *   1. Subscribe to OpenCode event stream (SSE)
 *   2. Call promptAsync (non-blocking, returns 204)
 *   3. Iterate events, filter to our session
 *   4. Dispatch each event through OpenCodeUIStreamConverter
 *   5. Auto-approve permission.asked events
 *   6. Reject question.asked events with an error chunk
 *   7. Finish when session becomes idle or stream ends
 */
export async function executeOpenCodePrompt(options: {
  client: OpencodeClient
  sessionId: string
  userMessage?: UIMessage
  promptText?: string
  writer: UIMessageStreamWriter
  abortSignal?: AbortSignal
  directory?: string
  model?: { providerID: string; modelID: string }
  agent?: string
  onFinish?: (message: { id: string; parts: Part[] }) => void | Promise<void>
}): Promise<void> {
  const {
    client,
    sessionId,
    userMessage,
    promptText,
    writer,
    abortSignal,
    directory,
    model,
    agent,
    onFinish,
  } = options

  abortSignal?.throwIfAborted()

  const messageId = generateId()
  const accumulatedParts = new Map<string, Part>()
  const converter = new OpenCodeUIStreamConverter(writer)

  // ── 1. Build prompt parts ─────────────────────────────────────
  const promptParts =
    userMessage != null
      ? convertUIMessageToOpenCodeParts(userMessage)
      : promptText
        ? [{ type: "text" as const, text: promptText }]
        : []

  if (promptParts.length === 0) {
    writer.write({
      type: "error",
      errorText: "No prompt content to send to OpenCode",
    })
    converter.finish("error")
    return
  }

  // ── 2. Subscribe to events ────────────────────────────────────
  logger.debug("Subscribing to OpenCode events", { sessionId })
  const eventResult = await withTimeout(
    () => client.event.subscribe(),
    15_000,
    "event.subscribe",
  )

  // ── 3. Send prompt (non-blocking) ─────────────────────────────
  logger.debug("Sending promptAsync", { sessionId })
  await withTimeout(
    () =>
      client.session.promptAsync({
        sessionID: sessionId,
        parts: promptParts,
        messageID: messageId,
        ...(directory ? { directory } : {}),
        ...(model ? { model } : {}),
        ...(agent ? { agent } : {}),
      }),
    15_000,
    "session.promptAsync",
  )

  writer.write({ type: "start", messageId })

  // ── 4. Event loop ─────────────────────────────────────────────
  let lastEventTime = Date.now()
  let timedOut = false

  const overallTimer = setTimeout(() => {
    if (timedOut) return
    timedOut = true
    logger.warn("Stream prompt overall timeout reached — aborting session", {
      sessionId,
    })
    client.session
      .abort({
        sessionID: sessionId,
        ...(directory ? { directory } : {}),
      })
      .catch((err: unknown) => {
        logger.warn("Failed to abort timed-out OpenCode session", {
          sessionId,
          error: String(err),
        })
      })
  }, PROMPT_TIMEOUT_MS)

  // Abort handler: call session.abort so OpenCode stops server-side
  const handleAbort = () => {
    logger.info("Abort signal fired — aborting OpenCode session", { sessionId })
    client.session
      .abort({
        sessionID: sessionId,
        ...(directory ? { directory } : {}),
      })
      .catch((err: unknown) => {
        logger.warn("Failed to abort OpenCode session", {
          sessionId,
          error: String(err),
        })
      })
  }
  abortSignal?.addEventListener("abort", handleAbort)

  try {
    for await (const rawEvent of eventResult.stream) {
      if (abortSignal?.aborted || timedOut) break

      lastEventTime = Date.now()

      const event = unwrapOpenCodeEvent(rawEvent)
      if (!event) continue

      // Filter to our session
      const eventSessionId = getOpenCodeEventSessionId(event)
      if (eventSessionId !== undefined && eventSessionId !== sessionId) continue

      // ── Permission: auto-approve ────────────────────────────
      if (event.type === "permission.asked") {
        const info = getPermissionRequestInfo(event.properties)
        if (info) {
          converter.writePermissionRequest({
            approvalId: info.requestId,
            toolCallId: info.toolCallId,
          })
          await approveOpenCodePermission({
            client,
            requestId: info.requestId,
            sessionId,
            directory,
          })
        }
        continue
      }

      // ── Question: reject and emit error ────────────────────
      if (event.type === "question.asked") {
        const props = event.properties as { id?: string }
        if (props.id) {
          converter.writeQuestionError(props.id)
          await rejectOpenCodeQuestion({ client, properties: event.properties, directory })
        }
        continue
      }

      // ── Part accumulation for onFinish ─────────────────────
      if (event.type === "message.part.updated") {
        const part = (event.properties as { part?: Part }).part
        if (part?.id) accumulatedParts.set(part.id, part)
      }

      // ── Dispatch to converter ──────────────────────────────
      converter.handle(event)

      // ── Session complete ───────────────────────────────────
      if (isOpenCodeSessionComplete(event, sessionId)) {
        logger.debug("Session complete", { sessionId, eventType: event.type })
        converter.finish("stop")
        await onFinish?.({
          id: messageId,
          parts: Array.from(accumulatedParts.values()),
        })
        return
      }

      // ── Idle timeout check ─────────────────────────────────
      if (Date.now() - lastEventTime > EVENT_IDLE_TIMEOUT_MS) {
        logger.warn("Event stream idle timeout", {
          sessionId,
          idleMs: Date.now() - lastEventTime,
        })
        break
      }
    }

    logger.debug("Event stream iteration ended", { sessionId })
    converter.finish(abortSignal?.aborted ? "other" : "stop")
    await onFinish?.({
      id: messageId,
      parts: Array.from(accumulatedParts.values()),
    })
  } finally {
    clearTimeout(overallTimer)
    abortSignal?.removeEventListener("abort", handleAbort)
  }
}

/**
 * Stream an OpenCode prompt as a UIMessageStream (for API route usage).
 */
export function createOpenCodeUIStream(
  options: StreamOpenCodeOptions,
): ReadableStream<UIMessageChunk> {
  const {
    client,
    sessionId,
    userMessage,
    promptText,
    originalMessages,
    abortSignal,
    directory,
    model,
    agent,
    onFinish,
  } = options

  return createUIMessageStream({
    execute: async ({ writer }) => {
      await executeOpenCodePrompt({
        client,
        sessionId,
        userMessage,
        promptText,
        writer,
        abortSignal,
        directory,
        model,
        agent,
        onFinish,
      })
    },
    originalMessages,
  })
}

/**
 * Stream an OpenCode prompt and return an HTTP Response.
 */
export async function streamOpenCodePrompt(
  options: StreamOpenCodeOptions,
): Promise<Response> {
  const stream = createOpenCodeUIStream(options)
  return createUIMessageStreamResponse({ stream })
}
