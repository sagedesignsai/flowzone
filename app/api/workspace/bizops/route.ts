/**
 * POST /api/workspace/bizops
 *
 * Streaming chat completion endpoint for the Business Operations agent.
 * Routes requests to the BizOps Agent, which manages projects, clients,
 * finances, workflows, and operational processes.
 *
 * The agent can:
 * - Research business tools, templates, and best practices via web search
 * - Track projects, tasks, and deliverables
 * - Manage client onboarding and communication
 * - Create invoices, expense trackers, and financial reports
 * - Build SOPs, templates, and automated workflows
 * - Save all business documents as files in the sandbox
 *
 * Request body:  { messages: UIMessage[], id: string, projectId?: string, webSearch?: boolean }
 * Response:      SSE stream of UI message chunks
 *   500 { error: string } if no AI provider configured
 *   503 { error: string } if no sandbox available
 */

import { type UIMessage } from "ai"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { handleBizOpsChat } from "@/lib/chat/handlers/bizops"

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

    // ── Route to BizOps Agent Handler ─────────────────────
    return handleBizOpsChat({
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
