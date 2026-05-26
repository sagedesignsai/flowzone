import { dedupeDesktopCreate } from "@/lib/desktop/dedupe"
import { upsertDesktopRun, getDesktopRunForChat } from "@/lib/desktop/persistence"
import { killDesktopSandbox } from "@/lib/desktop/kill"

export interface DesktopSandboxSession {
  sandboxId: string
  vncUrl: string
}

async function createE2bDesktop(options: {
  chatId: string
  projectId?: string
  userId: string
  userName?: string | null
  userEmail?: string | null
}): Promise<DesktopSandboxSession> {
  const { chatId, projectId, userId, userName, userEmail } = options

  const { Sandbox } = await import("@e2b/desktop")
  const timeoutMs = Number(process.env.E2B_DESKTOP_TIMEOUT_MS ?? 300_000)
  const template =
    process.env.E2B_DESKTOP_TEMPLATE ?? "flowzone-desktop-dev"

  const desktop = await Sandbox.create(template, {
    resolution: [1280, 800],
    dpi: 96,
    timeoutMs,
    envs: {
      FLOWZONE_API_URL:
        process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000",
      FLOWZONE_CHAT_ID: chatId,
      FLOWZONE_PROJECT_ID: projectId ?? "",
      GITHUB_TOKEN: process.env.GITHUB_TOKEN ?? "",
      GIT_AUTHOR_NAME: process.env.GIT_AUTHOR_NAME ?? userName ?? "",
      GIT_AUTHOR_EMAIL: process.env.GIT_AUTHOR_EMAIL ?? userEmail ?? "",
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
    },
    metadata: {
      userId,
      projectId: projectId ?? "",
      chatId,
    },
  })

  await desktop.stream.start()
  const vncUrl = desktop.stream.getUrl()

  await upsertDesktopRun({
    chatId,
    userId,
    e2bSandboxId: desktop.sandboxId,
    status: "running",
  })

  return { sandboxId: desktop.sandboxId, vncUrl }
}

/**
 * Create or return an existing desktop sandbox for a chat (deduplicated).
 */
export async function getOrCreateDesktopSandbox(options: {
  chatId: string
  projectId?: string
  userId: string
  userName?: string | null
  userEmail?: string | null
}): Promise<DesktopSandboxSession> {
  const existing = await getDesktopRunForChat(options.chatId)
  if (existing && existing.status !== "stopped") {
    try {
      const { Sandbox } = await import("@e2b/desktop")
      const desktop = await Sandbox.connect(existing.e2bSandboxId)
      await desktop.setTimeout(
        Number(process.env.E2B_DESKTOP_TIMEOUT_MS ?? 300_000),
      )
      try {
        await desktop.stream.stop()
      } catch {
        // stream may not be running
      }
      await desktop.stream.start()
      return {
        sandboxId: existing.e2bSandboxId,
        vncUrl: desktop.stream.getUrl(),
      }
    } catch {
      await killDesktopSandbox(existing.e2bSandboxId)
    }
  }

  return dedupeDesktopCreate(options.chatId, () => createE2bDesktop(options))
}

export async function reconnectDesktopSandbox(
  sandboxId: string,
): Promise<DesktopSandboxSession> {
  const { Sandbox } = await import("@e2b/desktop")
  const timeoutMs = Number(process.env.E2B_DESKTOP_TIMEOUT_MS ?? 300_000)
  const desktop = await Sandbox.connect(sandboxId)
  await desktop.setTimeout(timeoutMs)
  try {
    await desktop.stream.stop()
  } catch {
    // ignore
  }
  await desktop.stream.start()
  return { sandboxId, vncUrl: desktop.stream.getUrl() }
}
