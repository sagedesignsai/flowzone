import { prisma } from "@/lib/prisma"
import type { UIMessage } from "ai"
import { logger } from "@/lib/logger"

function generateTitleFromMessage(message: string): string {
  return message.split("\n")[0]?.slice(0, 60) || "New Chat"
}

export async function ensureChat(
  chatId: string,
  userId: string,
  firstMessageText?: string,
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
        },
      })
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
