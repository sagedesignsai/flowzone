import { prisma } from "@/lib/prisma"
import type { UIMessage } from "ai"

/**
 * Chat Store
 *
 * Provides database operations for persisting and loading chat messages.
 */

// ── Helpers ────────────────────────────────────────────────

function generateTitleFromMessage(message: string): string {
  return message.split("\n")[0]?.slice(0, 60) || "New Chat"
}

// ── Chat Operations ────────────────────────────────────────

/**
 * Ensure a chat exists in the database.
 * If it doesn't exist, it creates one with the provided title and user ID.
 */
export async function ensureChat(
  chatId: string,
  userId: string,
  firstMessageText?: string
): Promise<void> {
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
}

// ── Message Operations ─────────────────────────────────────

/**
 * Load all messages for a specific chat.
 * Transforms the Prisma message records into AI SDK UIMessage format.
 */
export async function loadChat(chatId: string): Promise<UIMessage[]> {
  const records = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
  })

  return records.map((record) => ({
    id: record.id,
    role: record.role as UIMessage["role"],
    parts: record.parts as unknown as UIMessage["parts"],
  }))
}

/**
 * Save an array of messages for a specific chat.
 * Overwrites existing messages with the same ID, or creates new ones.
 *
 * @param chatId The ID of the chat these messages belong to
 * @param messages The complete array of messages to persist
 */
export async function saveChat({
  chatId,
  messages,
}: {
  chatId: string
  messages: UIMessage[]
}): Promise<void> {
  if (!messages || messages.length === 0) return

  // Use a transaction to perform upserts efficiently
  await prisma.$transaction(
    messages.map((message) => {
      // Extract concatenated text content for the database summary field
      const textContent = message.parts
        .filter((part) => part.type === "text")
        // @ts-ignore - We know text parts have a text property
        .map((part) => part.text || "")
        .join("")

      return prisma.message.upsert({
        where: { id: message.id },
        update: {
          role: message.role,
          content: textContent,
          // @ts-ignore - Prisma Json matches any JSON-serializable object
          parts: message.parts,
        },
        create: {
          id: message.id,
          chatId,
          role: message.role,
          content: textContent,
          // @ts-ignore - Prisma Json matches any JSON-serializable object
          parts: message.parts,
        },
      })
    })
  )
}
