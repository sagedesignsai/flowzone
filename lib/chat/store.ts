import { prisma } from "@/lib/prisma"
import { createBranch } from "@/lib/github/branches"
import type { UIMessage } from "ai"
import { logger } from "@/lib/logger"

function generateTitleFromMessage(message: string): string {
  return message.split("\n")[0]?.slice(0, 60) || "New Chat"
}

/**
 * When a new chat is created under a project that has a linked GitRepo,
 * auto-create the dedicated branch and link the chat to the repo.
 * The sandbox is created lazily when the first message is processed.
 */
async function autoImportRepoForChat(
  chatId: string,
  projectId: string,
): Promise<void> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { gitRepos: { take: 1 } },
    })

    const gitRepo = project?.gitRepos[0]
    if (!gitRepo || !gitRepo.installationId) return

    const chatBranch = `flowzone/${chatId.slice(0, 8)}`
    const installationId = Number(gitRepo.installationId)

    try {
      await createBranch({
        baseBranch: gitRepo.defaultBranch,
        installationId,
        newBranch: chatBranch,
        owner: gitRepo.owner,
        repo: gitRepo.name,
      })
    } catch {
      // Branch may already exist from a previous import
    }

    await prisma.chat.update({
      where: { id: chatId },
      data: {
        gitBranch: chatBranch,
        gitRepoId: gitRepo.id,
      },
    })
  } catch (error) {
    logger.warn("autoImportRepoForChat failed", { chatId, error: String(error) })
  }
}

export async function ensureChat(
  chatId: string,
  userId: string,
  firstMessageText?: string,
  projectId?: string,
): Promise<void> {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true },
    })

    if (!chat) {
      await prisma.chat.create({
        data: {
          id: chatId,
          title: firstMessageText
            ? generateTitleFromMessage(firstMessageText)
            : "New Chat",
          userId,
          projectId: projectId ?? null,
        },
      })

      // Auto-import repo if project has one linked
      if (projectId) {
        await autoImportRepoForChat(chatId, projectId)
      }
    }
  } catch (error) {
    logger.warn("ensureChat failed", { chatId, error: String(error) })
  }
}

export async function loadChat(chatId: string): Promise<UIMessage[]> {
  try {
    const records = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
    })

    return records.map((record) => ({
      id: record.id,
      role: record.role as UIMessage["role"],
      parts: record.parts as unknown as UIMessage["parts"],
    }))
  } catch (error) {
    logger.warn("loadChat failed", { chatId, error: String(error) })
    return []
  }
}

export interface ChatContext {
  combinedMessages: UIMessage[]
  latestTextPartText: string
}

/**
 * Load previous messages from DB and merge with incoming.
 * Returns combined messages and the latest user text.
 */
export async function prepareChat(
  chatId: string,
  userId: string,
  incomingMessages: UIMessage[],
  projectId?: string,
): Promise<ChatContext> {
  let previousMessages: UIMessage[] = []
  try {
    previousMessages = await loadChat(chatId)
  } catch (error) {
    logger.warn("Failed to load previous messages", {
      chatId,
      error: String(error),
    })
  }

  const latestMessage = incomingMessages[incomingMessages.length - 1]
  const latestTextPart = latestMessage?.parts?.find((p) => p.type === "text")
  const latestTextPartText = (
    latestTextPart as { text?: string } | undefined
  )?.text ?? ""
  const firstMessageText = latestTextPartText

  try {
    await ensureChat(chatId, userId, firstMessageText, projectId)
  } catch (error) {
    logger.warn("Failed to ensure chat exists", {
      chatId,
      error: String(error),
    })
  }

  let combinedMessages: UIMessage[] = incomingMessages
  if (incomingMessages.length === 1 && previousMessages.length > 0) {
    combinedMessages = [...previousMessages, incomingMessages[0]]
  }

  return { combinedMessages, latestTextPartText }
}

export async function saveChat({
  chatId,
  messages,
}: {
  chatId: string
  messages: UIMessage[]
}): Promise<void> {
  if (!messages || messages.length === 0) return

  // Only persist the new assistant message, not the entire history.
  // The client Zustand store handles full history persistence;
  // the DB is for server-side session continuity on reconnect.
  const newMessages = messages.filter((m) => {
    // Keep only user & assistant messages that likely aren't persisted yet.
    // We use a heuristic: check if the message is the last assistant message.
    return m.role === "assistant"
  })

  // Take only the last assistant message (the one we just generated)
  const lastAssistant = newMessages[newMessages.length - 1]
  if (!lastAssistant) return

  try {
    const textContent = lastAssistant.parts
      .filter((part) => part.type === "text")
      .map((part) => (part as { text: string }).text || "")
      .join("")

    await prisma.message.upsert({
      where: { id: lastAssistant.id },
      update: {
        role: lastAssistant.role,
        content: textContent,
        parts: lastAssistant.parts as unknown as Record<string, unknown>,
      },
      create: {
        id: lastAssistant.id,
        chatId,
        role: lastAssistant.role,
        content: textContent,
        parts: lastAssistant.parts as unknown as Record<string, unknown>,
      },
    })
  } catch (error) {
    logger.warn("saveChat failed", { chatId, error: String(error) })
  }
}
