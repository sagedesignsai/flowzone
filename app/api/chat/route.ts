/**
 * POST /api/chat
 *
 * Streaming chat completion endpoint.
 * Routes to the appropriate agent based on the request context:
 *   1. DesktopAgent (if messages contain a desktop sandbox attachment)
 *   2. OpenCode Sandbox Agent (preferred — requires E2B sandbox)
 *   3. FlowzoneAgent (fallback — no sandbox required)
 *
 * Request body:
 *   { messages: UIMessage[], id?: string }
 *
 * Response:
 *   SSE stream of UI message chunks
 *   500 { error: string } if no AI provider configured
 */

import { type UIMessage } from "ai"
import { auth } from "@/lib/auth"
import { ensureChat, loadChat } from "@/lib/chat/store"
import { tryCreateSandbox } from "@/lib/chat/sandbox"
import { getDesktopSandboxId } from "@/lib/chat/handlers/desktop"
import { handleDesktopChat } from "@/lib/chat/handlers/desktop"
import { handleOpenCodeChat } from "@/lib/chat/handlers/opencode"
import { handleFlowzoneChat } from "@/lib/chat/handlers/flowzone"
import { headers } from "next/headers"

function errorResponse(status: number, message: string): Response {
  return Response.json({ error: message }, { status })
}

/**
 * Load previous messages from DB and merge with incoming.
 * Returns combined messages and the latest user text.
 */
async function prepareChat(
  chatId: string,
  userId: string,
  incomingMessages: UIMessage[],
): Promise<{
  combinedMessages: UIMessage[]
  latestTextPartText: string
}> {
  const previousMessages = await loadChat(chatId)
  const latestMessage = incomingMessages[incomingMessages.length - 1]
  const latestTextPart = latestMessage?.parts?.find((p) => p.type === "text")
  const latestTextPartText = (
    latestTextPart as { text?: string } | undefined
  )?.text ?? ""
  const firstMessageText = latestTextPartText

  await ensureChat(chatId, userId, firstMessageText)

  let combinedMessages: UIMessage[] = incomingMessages
  if (incomingMessages.length === 1 && previousMessages.length > 0) {
    combinedMessages = [...previousMessages, incomingMessages[0]]
  }

  return { combinedMessages, latestTextPartText }
}

export async function POST(req: Request) {
  try {
    const { messages: incomingMessages, id } = (await req.json()) as {
      messages: UIMessage[]
      id?: string
    }

    if (!id) {
      return errorResponse(400, "Chat ID is required")
    }

    // ── Authenticate ──────────────────────────────────────
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return errorResponse(401, "Unauthorized")
    }

    // ── Detect desktop mode ───────────────────────────────
    const desktopSandboxId = getDesktopSandboxId(incomingMessages)

    if (desktopSandboxId) {
      return handleDesktopChat(id, session.user.id, desktopSandboxId, incomingMessages)
    }

    // ── Load messages & prepare context ───────────────────
    const { combinedMessages, latestTextPartText } = await prepareChat(
      id,
      session.user.id,
      incomingMessages,
    )

    // ── Try OpenCode sandbox agent (preferred) ────────────
    const sandbox = await tryCreateSandbox(id)

    if (sandbox) {
      try {
        return await handleOpenCodeChat({
          sandboxCtx: { ...sandbox, chatId: id },
          chatId: id,
          combinedMessages,
          latestTextPartText,
        })
      } catch (openCodeError) {
        console.warn(
          "OpenCode sandbox agent failed, falling back to FlowzoneAgent:",
          openCodeError,
        )
      }
    }

    // ── Fallback: FlowzoneAgent ───────────────────────────
    return handleFlowzoneChat(id, combinedMessages)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    console.error("POST /api/chat error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
