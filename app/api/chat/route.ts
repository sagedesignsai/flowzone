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
import { createDesktopAgent } from "@/lib/agents/desktop-agent"
import { SandboxContext } from "@/lib/tools/sandbox-store"
import type { SandboxContextValue } from "@/lib/tools/sandbox-store"
import { DesktopSandboxContext } from "@/lib/tools/desktop/sandbox-context"
import { getPrimaryModel } from "@/lib/ai/models"
import { ensureChat, loadChat, saveChat } from "@/lib/chat/store"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getInstallationToken } from "@/lib/github"
import { headers } from "next/headers"

// ── Desktop attachment detection ─────────────────────────────

/**
 * Check if the incoming messages contain a desktop sandbox attachment.
 * Returns the sandboxId if found, null otherwise.
 */
type MessageWithAttachments = UIMessage & {
  experimental_attachments?: Array<{ mimeType: string; data?: { sandboxId?: string } }>
}

function getDesktopSandboxId(messages: UIMessage[]): string | null {
  for (const msg of messages) {
    const extended = msg as MessageWithAttachments
    const attachments = extended.experimental_attachments
    if (!attachments) continue
    for (const a of attachments) {
      if (a.mimeType === "application/x-desktop-sandbox") {
        return a.data?.sandboxId ?? null
      }
    }
  }
  return null
}

// ── Sandbox creation with context bridging ─────────────────

/**
 * Try to create or reconnect to an E2B sandbox for a chat session.
 *
 * Bridge fix (BRIDGE-001): If the chat has an existing SandboxRun with
 * an e2bSandboxId, repoPath, and gitBranch, we reconnect to that sandbox
 * and populate the full context (including a fresh token) so agent tools
 * can operate on the cloned repo.
 *
 * If no existing sandbox exists, creates a new blank one.
 */
async function tryCreateSandbox(chatId?: string): Promise<SandboxContextValue | null> {
  if (!process.env.E2B_API_KEY) return null

  try {
    const { Sandbox } = await import("e2b")

    // ── Check for existing sandbox with repo context ──────────
    if (chatId) {
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { gitRepo: true, sandboxRun: true },
      })

      if (chat?.sandboxRun?.e2bSandboxId && chat.gitRepo && chat.gitBranch) {
        const { sandboxRun, gitRepo, gitBranch } = chat

        try {
          // Try to reconnect to the existing sandbox
          const sandbox = await Sandbox.connect(sandboxRun.e2bSandboxId)
          const repoPath = sandboxRun.repoPath ?? `/home/user/repo/${gitRepo.fullName}`

          // Get a fresh installation token (tokens are short-lived)
          const instId = Number(gitRepo.installationId)
          const token = instId ? (await getInstallationToken(instId)).token : undefined

          return {
            sandbox,
            repoPath,
            branch: gitBranch,
            token,
          }
        } catch {
          // Sandbox expired or unavailable — fall through to create new
          await prisma.sandboxRun.update({
            where: { id: sandboxRun.id },
            data: { status: "stopped" },
          })
        }
      }
    }

    // ── No existing sandbox — create a new blank one ──────────
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

    // ── Detect desktop mode ─────────────────────────────────
    const desktopSandboxId = getDesktopSandboxId(incomingMessages)

    if (desktopSandboxId) {
      // ── Route to DesktopAgent ──
      const agent = createDesktopAgent(model)

      // Load previous messages from DB
      const previousMessages = await loadChat(id)

      // Create the chat record if it doesn't exist
      await ensureChat(id, session.user.id)

      let combinedMessages: UIMessage[] = incomingMessages
      if (incomingMessages.length === 1 && previousMessages.length > 0) {
        combinedMessages = [...previousMessages, incomingMessages[0]]
      }

      // Validate messages against desktop tools
      const validatedMessages = await validateUIMessages({
        messages: combinedMessages,
        tools: agent.tools,
      })

      // Import @e2b/desktop dynamically and connect
      const { Sandbox } = await import("@e2b/desktop")
      const desktop = await Sandbox.connect(desktopSandboxId)
      await desktop.setTimeout(
        Number(process.env.E2B_DESKTOP_TIMEOUT_MS ?? 300000),
      )

      return DesktopSandboxContext.run({ desktop, sandboxId: desktopSandboxId, chatId: id }, () =>
        createAgentUIStreamResponse({
          agent,
          uiMessages: validatedMessages,
          originalMessages: validatedMessages,
          onFinish: async ({ messages }) => {
            await saveChat({ chatId: id, messages })
          },
        }),
      )
    }

    // ── Standard FlowzoneAgent mode ─────────────────────────
    const agent = createFlowzoneAgent(model)

    // Load previous messages from DB
    const previousMessages = await loadChat(id)

    // Extract the latest message
    const latestMessage = incomingMessages[incomingMessages.length - 1]

    // Create the chat if it doesn't exist, using the latest user message text for the title
    const latestTextPart = latestMessage?.parts?.find(p => p.type === "text")
    const firstMessageText = (latestTextPart as { text?: string } | undefined)?.text
    await ensureChat(id, session.user.id, firstMessageText)

    // Combine previous messages with the new incoming message
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

    // Try to create or reconnect to a sandbox for this session (optional)
    const sandboxCtxRaw = await tryCreateSandbox(id)
    const sandboxCtx = sandboxCtxRaw ? { ...sandboxCtxRaw, chatId: id } : null

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
