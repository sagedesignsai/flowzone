import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

const DEFAULT_DESKTOP_TIMEOUT_MS = 300_000

export interface DesktopRunData {
  chatId: string
  userId: string
  e2bSandboxId: string
  status?: string
  ptyPid?: number | null
}

export async function upsertDesktopRun(
  options: DesktopRunData,
): Promise<void> {
  const {
    chatId,
    userId,
    e2bSandboxId,
    status = "running",
    ptyPid,
  } = options
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
        ...(ptyPid !== undefined ? { ptyPid } : {}),
      },
      create: {
        chatId,
        userId,
        e2bSandboxId,
        status,
        expiresAt,
        ...(ptyPid !== undefined ? { ptyPid } : {}),
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
      ptyPid: true,
    },
  })
}

export async function getDesktopRunBySandboxId(sandboxId: string) {
  return prisma.desktopRun.findUnique({
    where: { e2bSandboxId: sandboxId },
    select: {
      e2bSandboxId: true,
      chatId: true,
      status: true,
      ptyPid: true,
      tmuxSession: true,
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
