import { prisma } from "@/lib/prisma"

export class DesktopAccessError extends Error {
  constructor(
    message: string,
    readonly status: 403 | 404 = 403,
  ) {
    super(message)
    this.name = "DesktopAccessError"
  }
}

/**
 * Verify the authenticated user owns the chat referenced by a desktop sandbox.
 */
export async function assertDesktopSandboxAccess(
  userId: string,
  sandboxId: string,
): Promise<{ chatId: string; e2bSandboxId: string }> {
  const run = await prisma.desktopRun.findUnique({
    where: { e2bSandboxId: sandboxId },
    select: {
      e2bSandboxId: true,
      chatId: true,
      userId: true,
      chat: { select: { userId: true } },
    },
  })

  if (!run) {
    throw new DesktopAccessError("Desktop sandbox not found", 404)
  }

  if (run.userId !== userId && run.chat.userId !== userId) {
    throw new DesktopAccessError("Forbidden")
  }

  return { chatId: run.chatId, e2bSandboxId: run.e2bSandboxId }
}

/**
 * Verify the user owns the chat before creating or reconnecting a desktop.
 */
export async function assertChatAccess(
  userId: string,
  chatId: string,
): Promise<{ desktopOptOut: boolean }> {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { userId: true, desktopOptOut: true },
  })

  if (!chat) {
    return { desktopOptOut: false }
  }

  if (chat.userId !== userId) {
    throw new DesktopAccessError("Forbidden")
  }

  return { desktopOptOut: chat.desktopOptOut }
}
