import { prisma } from "@/lib/prisma"
import type { UIMessage } from "ai"
import { logger } from "@/lib/logger"

const PERSISTABLE_ROLES = new Set<UIMessage["role"]>(["user", "assistant"])

function textFromParts(parts: UIMessage["parts"]): string {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text: string }).text ?? "")
    .join("")
}

/**
 * Merge DB history with the client's incoming batch.
 * Handles single-message deltas and full-history sync from useChat.
 */
export function mergeChatMessages(
  previous: UIMessage[],
  incoming: UIMessage[],
): UIMessage[] {
  if (incoming.length === 0) return previous
  if (previous.length === 0) return incoming

  if (incoming.length === 1) {
    const only = incoming[0]!
    if (!previous.some((m) => m.id === only.id)) {
      return [...previous, only]
    }
    return previous.map((m) => (m.id === only.id ? only : m))
  }

  if (incoming[0]?.id === previous[0]?.id) {
    return incoming
  }

  const byId = new Map<string, UIMessage>()
  for (const m of previous) byId.set(m.id, m)
  for (const m of incoming) byId.set(m.id, m)

  const ordered: UIMessage[] = []
  const seen = new Set<string>()

  for (const m of previous) {
    if (byId.has(m.id) && !seen.has(m.id)) {
      ordered.push(byId.get(m.id)!)
      seen.add(m.id)
    }
  }
  for (const m of incoming) {
    if (!seen.has(m.id)) {
      ordered.push(m)
      seen.add(m.id)
    }
  }

  return ordered
}

export async function upsertMessage(
  chatId: string,
  message: UIMessage,
): Promise<void> {
  if (!PERSISTABLE_ROLES.has(message.role)) return

  const textContent = textFromParts(message.parts)

  await prisma.message.upsert({
    where: { id: message.id },
    update: {
      role: message.role,
      content: textContent,
      parts: message.parts as unknown as Record<string, unknown>,
    },
    create: {
      id: message.id,
      chatId,
      role: message.role,
      content: textContent,
      parts: message.parts as unknown as Record<string, unknown>,
    },
  })
}

export async function persistMessages(
  chatId: string,
  messages: UIMessage[],
): Promise<void> {
  const toSave = messages.filter((m) => PERSISTABLE_ROLES.has(m.role))
  if (toSave.length === 0) return

  try {
    await Promise.all(toSave.map((m) => upsertMessage(chatId, m)))
  } catch (error) {
    logger.warn("persistMessages failed", { chatId, error: String(error) })
  }
}

export async function persistIncomingUserMessages(
  chatId: string,
  incoming: UIMessage[],
): Promise<void> {
  const userMessages = incoming.filter((m) => m.role === "user")
  if (userMessages.length === 0) return
  await persistMessages(chatId, userMessages)
}
