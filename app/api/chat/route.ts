/**
 * POST /api/chat
 *
 * Streaming chat completion endpoint.
 * Routes all requests to the Virtual Developer agent, which uses
 * OpenCode as its primary coding engine with optional desktop
 * sandbox capabilities for visual verification.
 *
 * Request body:
 *   { messages: UIMessage[], id?: string, projectId?: string, webSearch?: boolean }
 *
 * Response:
 *   SSE stream of UI message chunks
 *   500 { error: string } if no AI provider configured
 *   503 { error: string } if no sandbox available
 */

import { type UIMessage } from "ai"
import { auth } from "@/lib/auth"
import { handleVirtualDeveloperChat } from "@/lib/chat/handlers/virtual-dev"
import { headers } from "next/headers"

// OpenCode prompts can run several minutes. Desktop agents are even longer.
export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const { messages: incomingMessages, id, projectId, webSearch } =
      (await req.json()) as {
        messages: UIMessage[]
        id?: string
        projectId?: string
        webSearch?: boolean
      }

    if (!id) {
      return Response.json({ error: "Chat ID is required" }, { status: 400 })
    }

    // ── Authenticate ──────────────────────────────────────
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ── Route to Virtual Developer ────────────────────────
    return handleVirtualDeveloperChat({
      chatId: id,
      userId: session.user.id,
      incomingMessages,
      projectId,
      webSearch: Boolean(webSearch),
      abortSignal: req.signal,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return Response.json({ error: message }, { status: 500 })
  }
}
