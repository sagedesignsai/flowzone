import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

const DEFAULT_DESKTOP_TIMEOUT_MS = 300_000

export async function upsertDesktopRun(options: {
  chatId: string
  userId: string
  e2bSandboxId: string
  status?: string
}): Promise<void> {
  const { chatId, userId, e2bSandboxId, status = "running" } = options
  const expiresAt = new Date(
    Date.now() +
      Number(process.env.E2B_DESKTOP_TIMEOUT_MS ?? DEFAULT_DESKTOP_TIMEOUT_MS),
  )

  try {
    await prisma.desktopRun.upsert({
      where: { chatId },
      update: {
        e2bSandboxId,
        userId,
        status,
        expiresAt,
      },
      create: {
        chatId,
        userId,
        e2bSandboxId,
        status,
        expiresAt,
      },
    })
  } catch (error) {
    logger.warn("upsertDesktopRun failed", { chatId, error: String(error) })
  }
}

export async function getDesktopRunForChat(chatId: string) {
  return prisma.desktopRun.findUnique({
    where: { chatId },
    select: {
      e2bSandboxId: true,
      status: true,
      expiresAt: true,
    },
  })
}

export async function markDesktopRunStopped(chatId: string): Promise<void> {
  try {
    await prisma.desktopRun.updateMany({
      where: { chatId },
      data: { status: "stopped" },
    })
  } catch (error) {
    logger.warn("markDesktopRunStopped failed", { chatId, error: String(error) })
  }
}

export async function deleteDesktopRunRecord(chatId: string): Promise<string | null> {
  const run = await prisma.desktopRun.findUnique({
    where: { chatId },
    select: { e2bSandboxId: true },
  })

  if (!run) return null

  await prisma.desktopRun.delete({ where: { chatId } }).catch(() => {
    // record may already be gone
  })

  return run.e2bSandboxId
}
