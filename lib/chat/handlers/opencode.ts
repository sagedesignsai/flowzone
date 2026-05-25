import type { UIMessage } from "ai"
import type { SandboxContextValue } from "@/lib/tools/sandbox-store"
import { createOpenCodeManager } from "@/lib/opencode-sandbox/manager"
import { streamOpenCodePrompt } from "@/lib/opencode-sandbox/stream-prompt"
import { convertOpenCodePartsToUIMessageParts } from "@/lib/opencode-sandbox/convert"
import { resolveOpenCodeSession } from "@/lib/opencode-sandbox/session"
import { saveChat } from "@/lib/chat/store"
import { logger } from "@/lib/logger"
import { withTimeout } from "@/lib/retry"

function buildContextReplay(
  combinedMessages: UIMessage[],
  latestTextPartText: string,
): string {
  if (combinedMessages.length <= 1) return latestTextPartText

  const history = combinedMessages
    .slice(0, -1)
    .map((m) => {
      const text = m.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join(" ")
      return `${m.role}: ${text}`
    })
    .join("\n\n")

  return `Previous conversation:\n\n${history}\n\n---\n\nContinue the conversation. User's new message:\n${latestTextPartText}`
}

export async function handleOpenCodeChat(options: {
  sandboxCtx: SandboxContextValue
  chatId: string
  combinedMessages: UIMessage[]
  latestTextPartText: string
}): Promise<Response> {
  const { sandboxCtx, chatId, combinedMessages, latestTextPartText } = options

  logger.info("Handling chat via OpenCode sandbox agent", {
    chatId,
    sandboxId: sandboxCtx.sandbox.sandboxId,
    messageCount: combinedMessages.length,
  })

  const opencode = await withTimeout(
    () => createOpenCodeManager(sandboxCtx.sandbox),
    30_000,
    "createOpenCodeManager",
  )

  const { sessionId, isNew } = await resolveOpenCodeSession(
    opencode.client,
    chatId,
  )

  const promptText =
    isNew && combinedMessages.length > 1
      ? buildContextReplay(combinedMessages, latestTextPartText)
      : latestTextPartText

  logger.debug("Prompting OpenCode", {
    sessionId,
    isNew,
    promptLength: promptText.length,
  })

  const response = await streamOpenCodePrompt({
    client: opencode.client,
    sessionId,
    promptText,
    originalMessages: combinedMessages,
    onFinish: async (result) => {
      const assistantParts = convertOpenCodePartsToUIMessageParts(result.parts)
      const assistantMessage: UIMessage = {
        id: result.id,
        role: "assistant",
        parts: assistantParts,
      }
      await saveChat({
        chatId,
        messages: [...combinedMessages, assistantMessage],
      })
      logger.debug("Chat saved after stream", {
        chatId,
        partCount: result.parts.length,
      })
    },
  })

  return response
}
