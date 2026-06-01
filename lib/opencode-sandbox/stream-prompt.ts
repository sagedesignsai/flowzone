/**
 * Real-time streaming prompt for OpenCode.
 *
 * Uses promptAsync + event subscription instead of blocking prompt(),
 * yielding UI message chunks progressively as the model generates them.
 */

import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage, type UIMessageChunk, type UIMessageStreamWriter } from "ai"
import type { OpencodeClient } from "@opencode-ai/sdk"
import type {
  TextPartInput,
  Part,
  TextPart,
  ReasoningPart,
  ToolPart,
  FilePart,
  ToolStateCompleted,
  ToolStateError,
} from "@opencode-ai/sdk"
import { logger } from "@/lib/logger"
import { withTimeout } from "@/lib/retry"

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const EVENT_IDLE_TIMEOUT_MS = 120_000 // 2 min without events → assume done
const PROMPT_TIMEOUT_MS = 300_000 // 5 min total → safe upper bound

export interface StreamOpenCodeOptions {
  client: OpencodeClient
  sessionId: string
  promptText: string
  originalMessages: UIMessage[]
  onFinish?: (message: { id: string; parts: Part[] }) => void | Promise<void>
}

/**
 * Execute an OpenCode prompt and write UI message chunks to the writer.
 *
 * Architecture:
 *   1. Subscribe to OpenCode events (SSE)
 *   2. Call promptAsync (non-blocking, returns immediately)
 *   3. Iterate over event stream, filtering for our session
 *   4. Convert EventMessagePartUpdated deltas to UI message chunks
 *   5. Finish when the session becomes idle
 *   6. Invoke onFinish with the completed message parts for persistence
 */
export async function executeOpenCodePrompt(options: {
  client: OpencodeClient
  sessionId: string
  promptText: string
  writer: UIMessageStreamWriter
  abortSignal?: AbortSignal
  onFinish?: (message: { id: string; parts: Part[] }) => void | Promise<void>
}): Promise<void> {
  const { client, sessionId, promptText, writer, abortSignal, onFinish } =
    options
  const messageId = generateId()
  const accumulatedParts: Map<string, Part> = new Map()

  abortSignal?.throwIfAborted()

  // 1. Subscribe to events (with timeout)
  logger.debug("Subscribing to OpenCode events", { sessionId })
  const eventResult = await withTimeout(
    () => client.event.subscribe(),
    15_000,
    "event.subscribe",
  )

  // 2. Start the prompt (non-blocking — returns 204 No Content)
  logger.debug("Starting promptAsync", { sessionId })
  await withTimeout(
    () =>
      client.session.promptAsync({
        path: { id: sessionId },
        body: {
          parts: [{ type: "text", text: promptText } as TextPartInput],
        },
      }),
    15_000,
    "session.promptAsync",
  )

  writer.write({ type: "start", messageId })

  // 3. Track state
  const textPartContents = new Map<string, string>()
  const activeTextParts = new Set<string>()
  const toolCallInputs = new Map<string, { toolName: string; input: unknown }>()
  const completedParts = new Set<string>()
  let hasDrawnFinish = false
  let lastEventTime = Date.now()

  function done(): void {
    if (hasDrawnFinish) return
    hasDrawnFinish = true
    for (const partId of activeTextParts) {
      writer.write({ type: "text-end", id: partId })
    }
    activeTextParts.clear()
    writer.write({ type: "finish", finishReason: "stop" })
  }

  function abortIfNeeded(): void {
    abortSignal?.throwIfAborted()
  }

  // 4. Iterate over event stream with idle timeout
  //    Also set an overall timeout for the entire prompt execution.
  const overallTimer = setTimeout(() => {
    logger.warn("Stream prompt overall timeout reached", { sessionId })
    done()
  }, PROMPT_TIMEOUT_MS)

  try {
    for await (const event of eventResult.stream) {
      abortIfNeeded()
      lastEventTime = Date.now()
      const sessionMatch = getEventSessionId(event)
      if (sessionMatch !== undefined && sessionMatch !== sessionId) continue

      if (event.type === "message.part.updated") {
        const { part, delta } = event.properties

        if (completedParts.has(part.id)) continue

        if (part.type === "text" && !delta && part.text) {
          completedParts.add(part.id)
        }

        accumulatedParts.set(part.id, part)

        switch (part.type) {
          case "text":
            handleTextPartUpdate(writer, part as TextPart, delta, textPartContents, activeTextParts)
            break
          case "reasoning":
            handleReasoningPartUpdate(writer, part as ReasoningPart, delta, textPartContents, activeTextParts)
            break
          case "tool":
            handleToolPartUpdate(writer, part as ToolPart, toolCallInputs)
            break
          case "file":
            handleFilePartUpdate(writer, part as FilePart)
            break
        }
      } else if (event.type === "message.updated") {
        if (event.properties.info.time?.completed) {
          for (const partId of activeTextParts) {
            writer.write({ type: "text-end", id: partId })
          }
          activeTextParts.clear()
          done()
        }
      } else if (event.type === "session.idle" || event.type === "session.compacted") {
        logger.debug("Session idle/compacted — stream complete", { sessionId, eventType: event.type })
        done()
        await onFinish?.({ id: messageId, parts: Array.from(accumulatedParts.values()) })
        return
      }

      if (Date.now() - lastEventTime > EVENT_IDLE_TIMEOUT_MS) {
        logger.warn("Event stream idle timeout", { sessionId, idleMs: Date.now() - lastEventTime })
        break
      }
    }

    logger.debug("Event stream iteration ended", { sessionId, hasDrawnFinish })
    done()
    await onFinish?.({ id: messageId, parts: Array.from(accumulatedParts.values()) })
  } finally {
    clearTimeout(overallTimer)
  }
}

/**
 * Stream an OpenCode prompt as a UIMessage stream (for API route usage).
 * Wraps `executeOpenCodePrompt` in a UIMessageStream with persistence support.
 */
export function createOpenCodeUIStream(
  options: StreamOpenCodeOptions,
): ReadableStream<UIMessageChunk> {
  const { client, sessionId, promptText, originalMessages, onFinish } = options

  return createUIMessageStream({
    execute: async ({ writer }) => {
      await executeOpenCodePrompt({ client, sessionId, promptText, writer, onFinish })
    },
    originalMessages,
  })
}

/**
 * Stream an OpenCode prompt and return an HTTP Response.
 * Convenience wrapper around createOpenCodeUIStream.
 */
export async function streamOpenCodePrompt(
  options: StreamOpenCodeOptions,
): Promise<Response> {
  const stream = createOpenCodeUIStream(options)
  return createUIMessageStreamResponse({ stream })
}

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Extract session ID from an event (since different event types
 * store it in different places).
 */
function getEventSessionId(event: Record<string, unknown>): string | undefined {
  if (event.type === "message.part.updated") {
    const props = event.properties as { part?: { sessionID?: string } }
    return props.part?.sessionID
  }
  if (event.type === "message.updated") {
    const props = event.properties as { info?: { sessionID?: string } }
    return props.info?.sessionID
  }
  // session.idle, session.compacted, session.status, etc.
  const props = event.properties as { sessionID?: string }
  return props.sessionID
}

function handleTextPartUpdate(
  writer: UIMessageStreamWriter,
  part: TextPart,
  delta: string | undefined,
  textPartContents: Map<string, string>,
  activeTextParts: Set<string>,
): void {
  const partId = part.id
  const existing = textPartContents.get(partId) ?? ""

  if (existing === "") {
    writer.write({ type: "text-start", id: partId })
    activeTextParts.add(partId)
  }

  if (delta) {
    writer.write({ type: "text-delta", id: partId, delta })
    textPartContents.set(partId, existing + delta)
  } else if (part.text !== existing) {
    // No delta but text changed — send the difference
    const newDelta = part.text.slice(existing.length)
    if (newDelta) {
      writer.write({ type: "text-delta", id: partId, delta: newDelta })
      textPartContents.set(partId, part.text)
    }
  }
}

function handleReasoningPartUpdate(
  writer: UIMessageStreamWriter,
  part: ReasoningPart,
  delta: string | undefined,
  textPartContents: Map<string, string>,
  activeTextParts: Set<string>,
): void {
  const partId = part.id
  const existing = textPartContents.get(partId) ?? ""

  if (existing === "") {
    writer.write({ type: "reasoning-start", id: partId })
    activeTextParts.add(partId) // Track for close
  }

  if (delta) {
    writer.write({ type: "reasoning-delta", id: partId, delta })
    textPartContents.set(partId, existing + delta)
  } else if (part.text !== existing) {
    const newDelta = part.text.slice(existing.length)
    if (newDelta) {
      writer.write({ type: "reasoning-delta", id: partId, delta: newDelta })
      textPartContents.set(partId, part.text)
    }
  }
}

function handleToolPartUpdate(
  writer: UIMessageStreamWriter,
  part: ToolPart,
  toolCallInputs: Map<string, { toolName: string; input: unknown }>,
): void {
  const toolCallId = part.callID
  const toolName = part.tool

  if (!toolCallInputs.has(toolCallId)) {
    writer.write({ type: "tool-input-start", toolCallId, toolName })
    toolCallInputs.set(toolCallId, { toolName, input: part.state.input })
  }

  const state = part.state

  if (state.status === "completed") {
    writer.write({
      type: "tool-input-available",
      toolCallId,
      toolName,
      input: state.input,
    })
    const completed = state as ToolStateCompleted
    writer.write({
      type: "tool-output-available",
      toolCallId,
      output: completed.output,
    })
  } else if (state.status === "error") {
    writer.write({
      type: "tool-input-available",
      toolCallId,
      toolName,
      input: state.input,
    })
    const errorState = state as ToolStateError
    writer.write({
      type: "tool-output-error",
      toolCallId,
      errorText: errorState.error,
    })
  } else if (state.status === "running" || state.status === "pending") {
    writer.write({
      type: "tool-input-available",
      toolCallId,
      toolName,
      input: state.input,
    })
  }
}

function handleFilePartUpdate(
  writer: UIMessageStreamWriter,
  part: FilePart,
): void {
  writer.write({
    type: "file",
    url: part.url,
    mediaType: part.mime,
  })
}
