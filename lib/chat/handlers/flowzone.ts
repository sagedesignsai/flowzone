import {
  createAgentUIStreamResponse,
  validateUIMessages,
  type UIMessage,
} from "ai"
import { createFlowzoneAgent } from "@/lib/agents/flowzone-agent"
import { getPrimaryModel } from "@/lib/ai/models"
import { saveChat } from "@/lib/chat/store"

export async function handleFlowzoneChat(
  chatId: string,
  combinedMessages: UIMessage[],
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

  const agent = createFlowzoneAgent(model)
  const validatedMessages = await validateUIMessages({
    messages: combinedMessages,
    tools: agent.tools,
  })

  return createAgentUIStreamResponse({
    agent,
    uiMessages: validatedMessages,
    originalMessages: validatedMessages,
    onFinish: async ({ messages }) => {
      await saveChat({ chatId, messages })
    },
  })
}
