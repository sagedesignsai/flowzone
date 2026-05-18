/**
 * POST /api/chat
 *
 * Streaming chat completion endpoint using the Flowzone agent.
 * Uses createAgentUIStreamResponse for proper UIMessage stream format
 * compatible with useChat from @ai-sdk/react.
 *
 * Request body:
 *   { messages: UIMessage[], id?: string }
 *
 * Response:
 *   SSE stream of UI message chunks
 *   500 { error: string } if no AI provider configured
 */

import { createAgentUIStreamResponse, validateUIMessages, type UIMessage } from "ai"
import { createFlowzoneAgent } from "@/lib/agents/flowzone-agent"
import { SandboxContext } from "@/lib/tools/sandbox-store"
import type { SandboxContextValue } from "@/lib/tools/sandbox-store"
import { getPrimaryModel } from "@/lib/ai/models"
import { ensureChat, loadChat, saveChat } from "@/lib/chat/store"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// ── Optional sandbox creation ──────────────────────────────

async function tryCreateSandbox(): Promise<SandboxContextValue | null> {
  if (!process.env.E2B_API_KEY) return null

  try {
    // Dynamic import to avoid loading e2b when not configured
    const { Sandbox } = await import("e2b")
    const sandbox = await Sandbox.create()
    return { sandbox }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn("Failed to create E2B sandbox:", message)
    return null
  }
}

// ── Route handler ──────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const model = getPrimaryModel()

    if (!model) {
      return Response.json(
        {
          error:
            "No AI provider configured. Set AI_GATEWAY_API_KEY in your environment.",
        },
        { status: 500 },
      )
    }

    const { messages: incomingMessages, id } = (await req.json()) as {
      messages: UIMessage[]
      id?: string
    }

    if (!id) {
      return Response.json({ error: "Chat ID is required" }, { status: 400 })
    }

    // Ensure user is authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const agent = createFlowzoneAgent(model)

    // Load previous messages from DB
    const previousMessages = await loadChat(id)
    
    // Extract the latest message
    const latestMessage = incomingMessages[incomingMessages.length - 1]
    
    // Create the chat if it doesn't exist, using the latest user message text for the title
    const latestTextPart = latestMessage?.parts?.find(p => p.type === "text")
    // @ts-ignore
    const firstMessageText = latestTextPart?.text
    await ensureChat(id, session.user.id, firstMessageText)

    // Combine previous messages with the new incoming message
    // If incoming messages contains history (default behavior of useChat), we just use it
    // But validating against previous is safer
    let combinedMessages: UIMessage[] = incomingMessages
    
    // If the client only sent the latest message, append it to history
    if (incomingMessages.length === 1 && previousMessages.length > 0) {
      combinedMessages = [...previousMessages, incomingMessages[0]]
    }

    // Validate messages against tools
    const validatedMessages = await validateUIMessages({
      messages: combinedMessages,
      tools: agent.tools,
    })

    // Try to create a sandbox for this session (optional)
    const sandboxCtx = await tryCreateSandbox()

    if (sandboxCtx) {
      return SandboxContext.run(sandboxCtx, () =>
        createAgentUIStreamResponse({
          agent,
          uiMessages: validatedMessages,
          originalMessages: validatedMessages,
          onFinish: async ({ messages }) => {
            await saveChat({ chatId: id, messages })
          }
        }),
      )
    }

    return createAgentUIStreamResponse({
      agent,
      uiMessages: validatedMessages,
      originalMessages: validatedMessages,
      onFinish: async ({ messages }) => {
        await saveChat({ chatId: id, messages })
      }
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    console.error("POST /api/chat error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
