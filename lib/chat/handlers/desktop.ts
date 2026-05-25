import {
  createAgentUIStreamResponse,
  validateUIMessages,
  type UIMessage,
} from "ai"
import { createDesktopAgent } from "@/lib/agents/desktop-agent"
import { DesktopSandboxContext } from "@/lib/tools/desktop/sandbox-context"
import { getPrimaryModel } from "@/lib/ai/models"
import { ensureChat, loadChat, saveChat } from "@/lib/chat/store"

type MessageWithAttachments = UIMessage & {
  experimental_attachments?: Array<{
    mimeType: string
    data?: { sandboxId?: string }
  }>
}

/**
 * Check if the incoming messages contain a desktop sandbox attachment.
 * Returns the sandboxId if found, null otherwise.
 */
export function getDesktopSandboxId(messages: UIMessage[]): string | null {
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

export async function handleDesktopChat(
  chatId: string,
  userId: string,
  desktopSandboxId: string,
  incomingMessages: UIMessage[],
): Promise<Response> {
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

  const agent = createDesktopAgent(model)

  // Load previous messages from DB
  const previousMessages = await loadChat(chatId)

  // Create the chat record if it doesn't exist
  await ensureChat(chatId, userId)

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

  return DesktopSandboxContext.run(
    { desktop, sandboxId: desktopSandboxId, chatId },
    () =>
      createAgentUIStreamResponse({
        agent,
        uiMessages: validatedMessages,
        originalMessages: validatedMessages,
        onFinish: async ({ messages }) => {
          await saveChat({ chatId, messages })
        },
      }),
  )
}
