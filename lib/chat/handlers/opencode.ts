import type { UIMessage } from "ai"
import type { SandboxContextValue } from "@/lib/tools/sandbox-store"
import { createOpenCodeManager } from "@/lib/opencode-sandbox/manager"
import { createOpenCodeUIStreamResponse } from "@/lib/opencode-sandbox/stream"
import { convertOpenCodePartsToUIMessageParts } from "@/lib/opencode-sandbox/convert"
import { resolveOpenCodeSession } from "@/lib/opencode-sandbox/session"
import { saveChat } from "@/lib/chat/store"
import type { TextPartInput } from "@opencode-ai/sdk"

export async function handleOpenCodeChat(options: {
  sandboxCtx: SandboxContextValue
  chatId: string
  combinedMessages: UIMessage[]
  latestTextPartText: string
}): Promise<Response> {
  const { sandboxCtx, chatId, combinedMessages, latestTextPartText } = options

  const opencode = await createOpenCodeManager(sandboxCtx.sandbox)

  const opencodeSessionId = await resolveOpenCodeSession(
    opencode.client,
    chatId,
  )

  const result = await opencode.client.session.prompt({
    path: { id: opencodeSessionId },
    body: {
      parts: [{ type: "text", text: latestTextPartText } as TextPartInput],
    },
  })

  if (result.error) {
    throw new Error(
      `OpenCode prompt failed: ${JSON.stringify(result.error)}`,
    )
  }

  const data = result.data
  const assistantParts = convertOpenCodePartsToUIMessageParts(data.parts)

  const assistantMessage: UIMessage = {
    id: data.info.id,
    role: "assistant",
    parts: assistantParts,
  }

  await saveChat({
    chatId,
    messages: [...combinedMessages, assistantMessage],
  })

  return createOpenCodeUIStreamResponse(
    { info: data.info, parts: data.parts },
    combinedMessages,
  )
}
