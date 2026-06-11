/**
 * OpenCode Chat Handler
 *
 * Direct OpenCode runtime handler — offloads the entire agent + tools
 * into the E2B sandbox. Instead of wiring tools server-side via a
 * ToolLoopAgent, this handler:
 *   1. Creates/reuses an E2B sandbox with OpenCode server running inside
 *   2. Routes user messages directly to OpenCode via its HTTP API
 *   3. Streams OpenCode's response (text, reasoning, tool calls, files)
 *      directly back to the client as SSE
 *
 * The sandbox IS the agent runtime — no intermediate orchestration layer.
 */

import { type UIMessage } from "ai"
import { prepareChat } from "@/lib/chat/store"
import { tryCreateSandbox } from "@/lib/chat/sandbox"
import { createOpenCodeManager } from "@/lib/opencode-sandbox/manager"
import { resolveOpenCodeSession } from "@/lib/opencode-sandbox/session"
import { streamOpenCodePrompt } from "@/lib/opencode-sandbox/stream-prompt"
import { convertOpenCodePartsToUIMessageParts } from "@/lib/opencode-sandbox/convert"
import { upsertMessage } from "@/lib/chat/messages"
import { SandboxContext } from "@/lib/tools/sandbox-store"
import { logger } from "@/lib/logger"

export const OPENCODE_CHAT_MAX_DURATION = 300

/**
 * Extract the latest user UIMessage from a batch of incoming messages.
 */
function extractLatestUserMessage(messages: UIMessage[]): UIMessage | undefined {
  return [...messages].reverse().find((m) => m.role === "user")
}

/**
 * Extract the latest user message text from a batch of incoming messages.
 */
function extractLatestUserPrompt(messages: UIMessage[]): string {
  const lastUser = extractLatestUserMessage(messages)
  if (!lastUser) return ""
  const textPart = lastUser.parts?.find(
    (p): p is { type: "text"; text: string } => p.type === "text",
  )
  return textPart?.text ?? ""
}

export interface HandleOpencodeChatOptions {
  chatId: string
  userId: string
  incomingMessages: UIMessage[]
  projectId?: string
  /** Agent name to use for the OpenCode session */
  agent?: string
  /** Model to use for the OpenCode session */
  model?: { providerID: string; modelID: string }
}

/**
 * Handle a chat request by routing it directly to OpenCode running
 * inside an E2B sandbox.
 *
 * Accepts optional `model` and `agent` to control the OpenCode session.
 * Returns an SSE streaming response (via `createUIMessageStreamResponse`)
 * that the AI SDK `useChat` hook can consume on the client.
 */
export async function handleOpencodeChat(
  options: HandleOpencodeChatOptions,
): Promise<Response> {
  const { chatId, userId, incomingMessages, projectId, model, agent } = options

  // ── 1. Prepare chat ──────────────────────────────────────────
  const { combinedMessages } = await prepareChat(
    chatId,
    userId,
    incomingMessages,
    projectId,
    "opencode",
  )

  // ── 2. Get or create E2B sandbox ─────────────────────────────
  const sandboxResult = await tryCreateSandbox(chatId)

  if (!sandboxResult.ok) {
    const msg =
      sandboxResult.error?.code === "NO_API_KEY"
        ? "Set E2B_API_KEY in your environment."
        : (sandboxResult.error?.message ?? "Please try again later.")
    logger.warn("No sandbox available for OpenCode chat", {
      chatId,
      error: sandboxResult.error?.message,
    })
    return Response.json(
      { error: "A development sandbox is required. " + msg },
      { status: 503 },
    )
  }

  const sandboxCtx = sandboxResult.value
  sandboxCtx.chatId = chatId

  // ── 3. Start / connect OpenCode server in the sandbox ────────
  const opencode = await createOpenCodeManager(sandboxCtx.sandbox)

  // ── 4. Resolve or create OpenCode session ────────────────────
  const { sessionId } = await resolveOpenCodeSession(
    opencode.client,
    chatId,
    {
      ...(agent ? { agent } : {}),
      ...(model ? { model: { id: model.modelID, providerID: model.providerID } } : {}),
    },
  )

  // ── 5. Extract the latest user message ───────────────────────
  const userMessage = extractLatestUserMessage(incomingMessages)
  const promptText = extractLatestUserPrompt(incomingMessages)

  if (!userMessage && !promptText) {
    return Response.json({ error: "No user message found" }, { status: 400 })
  }

  // ── 6. Stream via OpenCode ───────────────────────────────────
  return SandboxContext.run(sandboxCtx, () =>
    streamOpenCodePrompt({
      client: opencode.client,
      sessionId,
      userMessage,
      promptText,
      originalMessages: combinedMessages,
      model: model ?? undefined,
      agent,
      onFinish: async ({ id: assistantMessageId, parts }) => {
        try {
          const uiParts = convertOpenCodePartsToUIMessageParts(parts)
          await upsertMessage(chatId, {
            id: assistantMessageId,
            role: "assistant",
            parts: uiParts,
          })
        } catch (error) {
          logger.warn("Failed to persist assistant message", {
            chatId,
            error: String(error),
          })
        }
      },
    }),
  )
}

/**
 * Legacy alias — called by the API route when no agents approach is desired.
 * For backward compatibility; prefer handleOpencodeChat directly.
 */
export { handleOpencodeChat as handleOpencodeChatDirect }
