/**
 * POST /api/chat/[id]/desktop
 *
 * Streaming chat completion using the Desktop Agent.
 * Connects to an existing E2B desktop sandbox and runs the desktop agent
 * within that sandbox context, enabling computer-use tool calls.
 *
 * Request body:
 *   { messages: UIMessage[], sandboxId: string }
 *
 * Response:
 *   SSE stream of UI message chunks (same format as /api/chat)
 */

import {
  createAgentUIStreamResponse,
  validateUIMessages,
  type UIMessage,
} from "ai"
import { createDesktopAgent } from "@/lib/agents/desktop-agent"
import { DesktopSandboxContext } from "@/lib/tools/desktop/sandbox-context"
import { getPrimaryModel } from "@/lib/ai/models"
import { ensureChat, loadChat, saveChat } from "@/lib/chat/store"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// ── Config ─────────────────────────────────────────────────

export const maxDuration = 800

// ── Route handler ──────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Auth check
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Parse body
    const { messages: incomingMessages, sandboxId } = (await req.json()) as {
      messages: UIMessage[]
      sandboxId: string
    }

    // 3. Validate sandboxId
    if (!sandboxId) {
      return Response.json(
        { error: "sandboxId is required to use the desktop agent" },
        { status: 400 }
      )
    }

    // 4. Require E2B_API_KEY — desktop agent is always sandbox-bound
    if (!process.env.E2B_API_KEY) {
      return Response.json(
        { error: "E2B_API_KEY is not configured" },
        { status: 500 }
      )
    }

    // 5. Dynamic import — avoids loading @e2b/desktop when not configured
    const { Sandbox } = await import("@e2b/desktop")

    // 6. Resolve model
    const model = getPrimaryModel()

    if (!model) {
      return Response.json(
        {
          error:
            "No AI provider configured. Set AI_GATEWAY_API_KEY in your environment.",
        },
        { status: 500 }
      )
    }

    // 7. Build agent
    const agent = createDesktopAgent(model)

    // 8. Load previous messages from DB
    const previousMessages = await loadChat(id)

    // 9. Ensure the chat record exists in the database
    await ensureChat(id, session.user.id)

    // 10. Combine previous messages with the new incoming message.
    //     If the client only sent the latest message, prepend history.
    let combinedMessages: UIMessage[] = incomingMessages

    if (incomingMessages.length === 1 && previousMessages.length > 0) {
      combinedMessages = [...previousMessages, incomingMessages[0]]
    }

    // 11. Validate messages against the agent's tool definitions
    const validatedMessages = await validateUIMessages({
      messages: combinedMessages,
      tools: agent.tools,
    })

    // 12. Connect to the existing desktop sandbox
    const desktop = await Sandbox.connect(sandboxId)

    // 13. Keep the sandbox alive for the duration of the agent run
    await desktop.setTimeout(
      Number(process.env.E2B_DESKTOP_TIMEOUT_MS ?? 300000)
    )

    // 14. Run the agent inside the desktop sandbox context so that
    //     computer-use tools can read the sandbox via DesktopSandboxContext.get()
    return DesktopSandboxContext.run({ desktop, sandboxId }, () =>
      createAgentUIStreamResponse({
        agent,
        uiMessages: validatedMessages,
        originalMessages: validatedMessages,
        onFinish: async ({ messages }) => {
          await saveChat({ chatId: id, messages })
        },
      })
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    console.error("POST /api/chat/[id]/desktop error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
