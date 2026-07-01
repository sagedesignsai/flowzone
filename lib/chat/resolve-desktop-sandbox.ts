import type { UIMessage } from "ai"
import { prisma } from "@/lib/prisma"
import { DESKTOP_SANDBOX_MIME } from "@/lib/desktop/constants"
import {
  getDesktopRunForChat,
  isDesktopRunExpired,
  markDesktopRunStopped,
} from "@/lib/desktop/persistence"
import { assertDesktopSandboxAccess } from "@/lib/desktop/auth"

type MessageWithAttachments = UIMessage & {
  attachments?: Array<{
    mimeType: string
    data?: { sandboxId?: string; chatId?: string }
  }>
}

function getDesktopSandboxIdFromMessages(
  messages: UIMessage[],
): { sandboxId: string; chatId?: string } | null {
  for (const msg of messages) {
    const extended = msg as MessageWithAttachments
    const attachments = extended.attachments
    if (!attachments) continue
    for (const a of attachments) {
      if (a.mimeType === DESKTOP_SANDBOX_MIME && a.data?.sandboxId) {
        return {
          sandboxId: a.data.sandboxId,
          chatId: a.data.chatId,
        }
      }
    }
  }
  return null
}

/**
 * Resolve desktop sandbox for agent tools: message attachment first, then DB.
 * Verifies ownership when userId is provided.
 */
export async function resolveDesktopSandboxId(options: {
  chatId: string
  userId: string
  messages: UIMessage[]
  allowWithoutAttachment?: boolean
}): Promise<string | null> {
  const { chatId, userId, messages, allowWithoutAttachment = true } = options

  const fromMessage = getDesktopSandboxIdFromMessages(messages)
  if (fromMessage) {
    if (fromMessage.chatId && fromMessage.chatId !== chatId) {
      return null
    }
    try {
      await assertDesktopSandboxAccess(userId, fromMessage.sandboxId)
      return fromMessage.sandboxId
    } catch {
      return null
    }
  }

  if (!allowWithoutAttachment) return null

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { desktopOptOut: true },
  })

  if (chat?.desktopOptOut) return null

  const run = await getDesktopRunForChat(chatId)
  if (!run || run.status === "stopped") return null

  if (isDesktopRunExpired(run)) {
    await markDesktopRunStopped(chatId)
    return null
  }

  try {
    await assertDesktopSandboxAccess(userId, run.e2bSandboxId)
    return run.e2bSandboxId
  } catch {
    return null
  }
}
