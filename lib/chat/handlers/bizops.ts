/**
 * Business Operations Agent Chat Handler
 *
 * Routes chat requests to the BizOps agent with
 * sandbox tools for file operations + web search for research.
 */

import {
  createAgentUIStreamResponse,
  validateUIMessages,
  type UIMessage,
  type ToolSet,
} from "ai"
import { createBizOpsAgent } from "@/lib/agents/bizops-agent"
import { getPrimaryModel } from "@/lib/ai/models"
import { prepareChat, saveChat } from "@/lib/chat/store"
import { assertChatOwnership, isForbiddenError } from "@/lib/chat/access"
import { tryCreateSandbox } from "@/lib/chat/sandbox"
import { SandboxContext } from "@/lib/tools/sandbox-store"
import { createWebSearchTool } from "@/lib/tools/web-search"
import { isWebSearchConfigured } from "@/lib/search/web"
import { runCommand, writeFile, readFile, listFiles } from "@/lib/tools/sandbox"
import { logger } from "@/lib/logger"

export async function handleBizOpsChat(options: {
  chatId: string
  userId: string
  incomingMessages: UIMessage[]
  projectId?: string
  webSearch?: boolean
  environment?: string
  abortSignal?: AbortSignal
}): Promise<Response> {
  const { chatId, userId, incomingMessages, projectId, webSearch, abortSignal } =
    options

  const model = getPrimaryModel()
  if (!model) {
    return Response.json(
      {
        error:
          "No AI provider configured. Set AI_PROVIDER and corresponding API key in your environment.",
      },
      { status: 500 },
    )
  }

  try {
    await assertChatOwnership(chatId, userId)
  } catch (error) {
    if (isForbiddenError(error)) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    throw error
  }

  const { combinedMessages } = await prepareChat(
    chatId,
    userId,
    incomingMessages,
    projectId,
    "bizops",
  )

  // ── Create E2B sandbox for file operations ──────────────
  const sandboxResult = await tryCreateSandbox(chatId)

  if (!sandboxResult.ok) {
    logger.warn("No sandbox available for BizOps Agent", {
      chatId,
      error: sandboxResult.error?.message,
    })
    return Response.json(
      {
        error:
          "A sandbox is required for business operations file storage. " +
          (sandboxResult.error?.code === "NO_API_KEY"
            ? "Set E2B_API_KEY in your environment."
            : (sandboxResult.error?.message ?? "Please try again later.")),
      },
      { status: 503 },
    )
  }

  const sandboxCtx = sandboxResult.value
  sandboxCtx.chatId = chatId

  // ── Build tools ─────────────────────────────────────────
  const extraTools: ToolSet = {
    runShellCommand: runCommand,
    writeFile,
    readFile,
    listFiles,
  }

  if (webSearch) {
    if (!isWebSearchConfigured()) {
      return Response.json(
        {
          error:
            "Web search is not configured. Set TAVILY_API_KEY or SERPER_API_KEY.",
        },
        { status: 503 },
      )
    }
    extraTools.webSearch = createWebSearchTool()
  }

  // ── Create BizOps agent ─────────────────────────────────
  const agent = createBizOpsAgent(model, extraTools)

  const validatedMessages = await validateUIMessages({
    messages: combinedMessages,
    tools: agent.tools as Parameters<typeof validateUIMessages>[0]["tools"],
  })

  const respond = () =>
    createAgentUIStreamResponse({
      agent,
      abortSignal,
      uiMessages: validatedMessages,
      originalMessages: validatedMessages as never,
      onEnd: async ({ messages }) => {
        await saveChat({ chatId, messages })
      },
    })

  return SandboxContext.run(sandboxCtx, respond)
}
