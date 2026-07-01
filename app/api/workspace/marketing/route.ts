/**
 * POST /api/workspace/marketing
 *
 * Streaming chat completion endpoint for the Marketing agent.
 * Routes requests to the Marketing Agent, which plans campaigns,
 * creates marketing assets, analyzes audiences, and tracks
 * marketing performance.
 *
 * The agent can:
 * - Research markets, competitors, and trends via web search
 * - Plan multi-channel campaigns with measurable KPIs
 * - Create marketing assets (ad copy, social posts, email campaigns)
 * - Analyze content and channel performance
 * - Save all plans and assets as files in the sandbox
 *
 * Request body:  { messages: UIMessage[], id: string, projectId?: string, webSearch?: boolean }
 * Response:      SSE stream of UI message chunks
 *   500 { error: string } if no AI provider configured
 *   503 { error: string } if no sandbox available
 */

import { type UIMessage } from "ai"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { handleMarketingChat } from "@/lib/chat/handlers/marketing"

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

    // ── Route to Marketing Agent Handler ──────────────────
    return handleMarketingChat({
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
