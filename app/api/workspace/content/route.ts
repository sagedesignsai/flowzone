/**
 * POST /api/workspace/content
 *
 * Streaming chat completion endpoint for the Content Generation agent.
 * Routes requests to the Content Agent, which researches, plans, writes,
 * and optimizes content across multiple formats.
 *
 * The agent can:
 * - Research topics via web search
 * - Write long-form content (blog posts, newsletters, email sequences)
 * - Write short-form content (social media, ad copy, subject lines)
 * - Create strategic documents (content calendars, editorial plans)
 * - Save all content as files in the sandbox
 *
 * Request body:  { messages: UIMessage[], id: string, projectId?: string, webSearch?: boolean }
 * Response:      SSE stream of UI message chunks
 *   500 { error: string } if no AI provider configured
 *   503 { error: string } if no sandbox available
 */

import { type UIMessage } from "ai"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { handleContentChat } from "@/lib/chat/handlers/content"

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

    // ── Route to Content Agent Handler ────────────────────
    return handleContentChat({
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
