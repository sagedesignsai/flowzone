/**
 * POST /api/workspace/code-agent
 *
 * Direct OpenCode runtime endpoint — offloads the full agent + tool
 * execution into an E2B sandbox running an OpenCode headless server.
 *
 * Unlike /api/workspace/desktop (which wires tools server-side via a
 * ToolLoopAgent), this endpoint is a thin proxy:
 *   1. Authenticates the user
 *   2. Creates/reuses an E2B sandbox with OpenCode running inside
 *   3. Routes the user's message directly to OpenCode's HTTP API
 *   4. Streams OpenCode's response (text, reasoning, tool calls, files)
 *      back as SSE — compatible with the AI SDK useChat hook
 *
 * This means ALL agent logic and tool execution happens inside the
 * sandbox, NOT on the Next.js server.
 *
 * Request body:  { messages: UIMessage[], id: string, projectId?: string, model?: { providerID: string, modelID: string }, agent?: string }
 * Response:      SSE stream of UI message chunks
 */

import { type UIMessage } from "ai"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import {
  handleOpencodeChat,
  OPENCODE_CHAT_MAX_DURATION,
} from "@/lib/chat/opencode-handler"

export const maxDuration = OPENCODE_CHAT_MAX_DURATION

export async function POST(req: Request) {
  try {
    const { messages: incomingMessages, id, projectId, model, agent } =
      (await req.json()) as {
        messages: UIMessage[]
        id?: string
        projectId?: string
        model?: { providerID: string; modelID: string }
        agent?: string
      }

    if (!id) {
      return Response.json({ error: "Chat ID is required" }, { status: 400 })
    }

    // ── Authenticate ──────────────────────────────────────────
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ── Route directly to OpenCode in sandbox ─────────────────
    return handleOpencodeChat({
      chatId: id,
      userId: session.user.id,
      incomingMessages,
      projectId,
      model,
      agent,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return Response.json({ error: message }, { status: 500 })
  }
}
