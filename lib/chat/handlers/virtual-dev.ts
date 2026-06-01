/**
 * Virtual Developer Handler
 *
 * Routes chat requests to the Virtual Developer agent with OpenCode
 * and optional desktop verification tools.
 */

import {
  createAgentUIStreamResponse,
  validateUIMessages,
  type UIMessage,
  type ToolSet,
} from "ai"
import { createVirtualDeveloper } from "@/lib/agents/virtual-dev-agent"
import { getPrimaryModel } from "@/lib/ai/models"
import { prepareChat, saveChat } from "@/lib/chat/store"
import { assertChatOwnership, isForbiddenError } from "@/lib/chat/access"
import { resolveDesktopSandboxId } from "@/lib/chat/resolve-desktop-sandbox"
import { tryCreateSandbox } from "@/lib/chat/sandbox"
import { SandboxContext } from "@/lib/tools/sandbox-store"
import { DesktopSandboxContext } from "@/lib/tools/desktop/sandbox-context"
import { allDesktopTools } from "@/lib/tools/desktop"
import { createWebSearchTool } from "@/lib/tools/web-search"
import { isWebSearchConfigured } from "@/lib/search/web"
import { logger } from "@/lib/logger"

export async function handleVirtualDeveloperChat(options: {
  chatId: string
  userId: string
  incomingMessages: UIMessage[]
  projectId?: string
  webSearch?: boolean
  abortSignal?: AbortSignal
}): Promise<Response> {
  const { chatId, userId, incomingMessages, projectId, webSearch, abortSignal } =
    options

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
  )

  const desktopSandboxId = await resolveDesktopSandboxId({
    chatId,
    userId,
    messages: incomingMessages,
  })

  const extraTools: ToolSet = {}

  // ── Single VM: when desktop is active, use it for everything ──
  if (desktopSandboxId) {
    Object.assign(extraTools, allDesktopTools)

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

    const { Sandbox } = await import("@e2b/desktop")
    const desktop = await Sandbox.connect(desktopSandboxId)
    await desktop.setTimeout(
      Number(process.env.E2B_DESKTOP_TIMEOUT_MS ?? 300000),
    )

    const agent = createVirtualDeveloper(model, extraTools)

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

    // Desktop sandbox extends e2b.Sandbox — use it in both contexts
    return DesktopSandboxContext.run(
      { desktop, sandboxId: desktopSandboxId, chatId },
      () => SandboxContext.run({ sandbox: desktop, chatId }, respond),
    )
  }

  // ── No desktop: fall back to lightweight code sandbox ──
  const sandboxResult = await tryCreateSandbox(chatId)

  if (!sandboxResult.ok) {
    logger.warn("No sandbox available for Virtual Developer", {
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

  const { runCommand, readFile } = await import("@/lib/tools/sandbox")
  extraTools.runShellCommand = runCommand
  extraTools.readFile = readFile

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

  const agent = createVirtualDeveloper(model, extraTools)

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
