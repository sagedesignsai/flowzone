import { prisma } from "@/lib/prisma"

export async function assertChatOwnership(
  chatId: string,
  userId: string,
): Promise<void> {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { userId: true },
  })

  if (!chat) return

  if (chat.userId !== userId) {
    throw new Error("FORBIDDEN")
  }
}

export function isForbiddenError(error: unknown): boolean {
  return error instanceof Error && error.message === "FORBIDDEN"
}
