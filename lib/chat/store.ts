import { prisma } from "@/lib/prisma"
import { createBranch } from "@/lib/github/branches"
import type { UIMessage } from "ai"
import { logger } from "@/lib/logger"
import {
  mergeChatMessages,
  persistIncomingUserMessages,
  persistMessages,
} from "@/lib/chat/messages"

function generateTitleFromMessage(message: string): string {
  return message.split("\n")[0]?.slice(0, 60) || "New Chat"
}

/**
 * When a new chat is created under a project that has a linked GitRepo,
 * auto-create the dedicated branch and link the chat to the repo.
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
      select: { id: true, projectId: true },
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

      if (projectId) {
        await autoImportRepoForChat(chatId, projectId)
      }
      return
    }

    if (projectId && !chat.projectId) {
      await prisma.chat.update({
        where: { id: chatId },
        data: { projectId },
      })
      await autoImportRepoForChat(chatId, projectId)
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
  const latestTextPartText =
    (latestTextPart as { text?: string } | undefined)?.text ?? ""

  try {
    await ensureChat(chatId, userId, latestTextPartText, projectId)
  } catch (error) {
    logger.warn("Failed to ensure chat exists", {
      chatId,
      error: String(error),
    })
  }

  await persistIncomingUserMessages(chatId, incomingMessages)

  const combinedMessages = mergeChatMessages(previousMessages, incomingMessages)

  return { combinedMessages, latestTextPartText }
}

export async function saveChat({
  chatId,
  messages,
}: {
  chatId: string
  messages: UIMessage[]
}): Promise<void> {
  await persistMessages(chatId, messages)
}
