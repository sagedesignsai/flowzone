/**
 * POST /api/workspace/virtual-dev-pty
 *
 * Streaming chat completion endpoint for the Virtual Developer PTY workspace.
 * Routes all requests to the Virtual Developer PTY agent, which uses an
 * interactive PTY terminal as its primary execution environment.
 *
 * The agent can:
 * - Create/interact with PTY shell sessions
 * - Run opencode in TUI mode via the terminal
 * - Use sandbox tools for file operations
 * - Stream terminal output to the user in real-time
 *
 * Request body:
 *   { messages: UIMessage[], id?: string, projectId?: string, webSearch?: boolean }
 *
 * Response:
 *   SSE stream of UI message chunks (text + terminal output via tool chunks)
 *   500 { error: string } if no AI provider configured
 *   503 { error: string } if no sandbox available
 */

import { type UIMessage } from "ai"
import { auth } from "@/lib/auth"
import { handleVirtualDevPtyChat } from "@/lib/chat/handlers/virtual-dev-pty"
import { headers } from "next/headers"

// PTY sessions can run for minutes (opencode TUI, long builds, etc.)
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

    // ── Route to Virtual Developer PTY Handler ────────────
    return handleVirtualDevPtyChat({
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
