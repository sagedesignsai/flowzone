/**
 * Virtual Developer Handler
 *
 * Single handler for the Virtual Developer agent. Routes all chat
 * requests to a unified agent that uses OpenCode as its primary
 * coding engine, with optional desktop sandbox capabilities.
 *
 * Sandbox strategy (cost-optimized):
 *   1. Always try to create/resume a code sandbox (for OpenCode)
 *   2. If desktop sandbox is available, add desktop verification tools
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
import { tryCreateSandbox } from "@/lib/chat/sandbox"
import { SandboxContext, type SandboxContextValue } from "@/lib/tools/sandbox-store"
import { DesktopSandboxContext } from "@/lib/tools/desktop/sandbox-context"
import { allDesktopTools } from "@/lib/tools/desktop"
import { logger } from "@/lib/logger"

export async function handleVirtualDeveloperChat(options: {
  chatId: string
  userId: string
  incomingMessages: UIMessage[]
  projectId?: string
}): Promise<Response> {
  const { chatId, userId, incomingMessages, projectId } = options

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

  // ── Load messages & prepare context ───────────────────
  const { combinedMessages } = await prepareChat(
    chatId,
    userId,
    incomingMessages,
    projectId,
  )

  // ── Try to create/resume sandbox (for OpenCode) ───────
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
            : sandboxResult.error?.message ?? "Please try again later."),
      },
      { status: 503 },
    )
  }

  const sandboxCtx = sandboxResult.value

  // ── Check for desktop sandbox attachment ──────────────
  const desktopSandboxId = getDesktopSandboxId(incomingMessages)

  // ── Build agent with appropriate tools ────────────────
  const extraTools: ToolSet = {}

  // If desktop sandbox is available, add desktop verification tools
  if (desktopSandboxId) {
    Object.assign(extraTools, allDesktopTools)
  } else {
    // Only code sandbox — add shell command for verification
    const { runCommand, readFile } = await import("@/lib/tools/sandbox")
    extraTools.runShellCommand = runCommand
    extraTools.readFile = readFile
  }

  // Also add the sandbox context's chatId so the submitToOpenCode
  // tool can find it. The tool reads SandboxContext.get()?.chatId
  sandboxCtx.chatId = chatId

  const agent = createVirtualDeveloper(model, extraTools)

  const validatedMessages = await validateUIMessages({
    messages: combinedMessages,
    tools: agent.tools as any,
  })

  // ── Stream response with appropriate context ──────────
  const respond = () =>
    createAgentUIStreamResponse({
      agent,
      uiMessages: validatedMessages,
      originalMessages: validatedMessages as any,
      onFinish: async ({ messages }) => {
        await saveChat({ chatId, messages })
      },
    })

  if (desktopSandboxId) {
    const { Sandbox } = await import("@e2b/desktop")
    const desktop = await Sandbox.connect(desktopSandboxId)
    await desktop.setTimeout(
      Number(process.env.E2B_DESKTOP_TIMEOUT_MS ?? 300000),
    )

    return DesktopSandboxContext.run(
      { desktop, sandboxId: desktopSandboxId, chatId },
      () => SandboxContext.run(sandboxCtx, respond),
    )
  }

  return SandboxContext.run(sandboxCtx, respond)
}

// ── Desktop sandbox ID detection ─────────────────────────

type MessageWithAttachments = UIMessage & {
  experimental_attachments?: Array<{
    mimeType: string
    data?: { sandboxId?: string }
  }>
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
