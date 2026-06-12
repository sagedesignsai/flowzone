/**
 * Virtual Developer PTY Handler
 *
 * Chat handler that routes requests to the Virtual Developer PTY agent.
 * Creates an E2B sandbox + PTY session, then runs the agent with
 * PTY terminal tools + sandbox tools + optional desktop tools.
 *
 * The PTY agent can interactively use the sandbox terminal to:
 * - Run opencode in TUI mode
 * - Execute shell commands with real-time output
 * - Interact with CLI applications
 */

import {
  createAgentUIStreamResponse,
  validateUIMessages,
  type UIMessage,
  type ToolSet,
} from "ai"
import { createVirtualDevPtyAgent } from "@/lib/agents/virtual-dev-pty-agent"
import { getPrimaryModel } from "@/lib/ai/models"
import { prepareChat, saveChat } from "@/lib/chat/store"
import { assertChatOwnership, isForbiddenError } from "@/lib/chat/access"
import { tryCreateSandbox } from "@/lib/chat/sandbox"
import { SandboxContext } from "@/lib/tools/sandbox-store"
import { createWebSearchTool } from "@/lib/tools/web-search"
import { isWebSearchConfigured } from "@/lib/search/web"
import { runCommand, writeFile, readFile, listFiles } from "@/lib/tools/sandbox"
import { logger } from "@/lib/logger"

export async function handleVirtualDevPtyChat(options: {
  chatId: string
  userId: string
  incomingMessages: UIMessage[]
  projectId?: string
  webSearch?: boolean
  environment?: string
  abortSignal?: AbortSignal
}): Promise<Response> {
  const {
    chatId,
    userId,
    incomingMessages,
    projectId,
    webSearch,
    abortSignal,
  } = options

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
    "code-agent",
  )

  // ── Create E2B sandbox ─────────────────────────────────
  const sandboxResult = await tryCreateSandbox(chatId)

  if (!sandboxResult.ok) {
    logger.warn("No sandbox available for Virtual Developer PTY", {
      chatId,
      error: sandboxResult.error?.message,
    })
    return Response.json(
      {
        error:
          "A development sandbox is required. " +
          (sandboxResult.error?.code === "NO_API_KEY"
            ? "Set E2B_API_KEY in your environment."
            : (sandboxResult.error?.message ?? "Please try again later.")),
      },
      { status: 503 },
    )
  }

  const sandboxCtx = sandboxResult.value
  sandboxCtx.chatId = chatId

  // ── Build tools ───────────────────────────────────────
  const extraTools: ToolSet = {
    // Sandbox tools for file operations and shell commands
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

  // ── Create PTY agent ──────────────────────────────────
  const agent = createVirtualDevPtyAgent(model, extraTools)

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
      onFinish: async ({ messages }) => {
        await saveChat({ chatId, messages })
      },
    })

  return SandboxContext.run(sandboxCtx, respond)
}
