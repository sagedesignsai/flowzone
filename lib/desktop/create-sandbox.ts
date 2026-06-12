import { logger } from "@/lib/logger"
import { dedupeDesktopCreate } from "@/lib/desktop/dedupe"
import {
  upsertDesktopRun,
  getDesktopRunForChat,
  getDesktopRunBySandboxId,
  isDesktopRunExpired,
  markDesktopRunStopped,
  refreshDesktopRunExpiration,
} from "@/lib/desktop/persistence"
import { killDesktopSandbox } from "@/lib/desktop/kill"

export interface DesktopSandboxSession {
  sandboxId: string
  vncUrl: string
  ptyPid?: number
}

function buildVncUrl(host: string): string {
  return `https://${host}/vnc.html?autoconnect=true&resize=scale`
}

async function createE2bDesktop(options: {
  chatId: string
  projectId?: string
  userId: string
  userName?: string | null
  userEmail?: string | null
}): Promise<DesktopSandboxSession> {
  const { chatId, projectId, userId, userName, userEmail } = options

  const timeoutMs = Number(process.env.E2B_DESKTOP_TIMEOUT_MS ?? 300_000)
  const template =
    process.env.E2B_DESKTOP_TEMPLATE ?? "flowzone-desktop-dev"

  const envs = {
    DISPLAY: ":0",
    FLOWZONE_API_URL:
      process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000",
    FLOWZONE_CHAT_ID: chatId,
    FLOWZONE_PROJECT_ID: projectId ?? "",
    GITHUB_TOKEN: process.env.GITHUB_TOKEN ?? "",
    GIT_AUTHOR_NAME: process.env.GIT_AUTHOR_NAME ?? userName ?? "",
    GIT_AUTHOR_EMAIL: process.env.GIT_AUTHOR_EMAIL ?? userEmail ?? "",
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  }

  // Step 1: Create sandbox (startup script auto-inits desktop + VNC)
  const { Sandbox: BaseSandbox } = await import("e2b")
  const raw = await BaseSandbox.create(template, {
    timeoutMs,
    envs,
    metadata: { userId, projectId: projectId ?? "", chatId },
  })
  logger.info("Sandbox created", { sandboxId: raw.sandboxId })

  // Step 2: Connect via @e2b/desktop for desktop tool access
  const { Sandbox } = await import("@e2b/desktop")
  const desktop = await Sandbox.connect(raw.sandboxId, {
    apiKey: process.env.E2B_API_KEY,
    requestTimeoutMs: timeoutMs,
  })

  // Step 3: Build VNC URL (startup script already runs Xvfb + x11vnc + noVNC)
  const host = desktop.getHost(6080)
  const vncUrl = buildVncUrl(host)

  // Persist immediately
  await upsertDesktopRun({
    chatId,
    userId,
    e2bSandboxId: desktop.sandboxId,
    status: "running",
  })

  // Create PTY asynchronously
  createPtyAsync(desktop, chatId).catch((err) =>
    logger.warn("Background PTY creation failed", {
      chatId,
      error: String(err),
    }),
  )

  return { sandboxId: desktop.sandboxId, vncUrl }
}

function getVncUrl(desktop: import("@e2b/desktop").Sandbox): string {
  const host = desktop.getHost(6080)
  return buildVncUrl(host)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Create a persistent PTY inside the desktop sandbox, start opencode
 * in the shared tmux session, and attach the PTY to it so the browser
 * terminal shows opencode's TUI. Also signals readiness via a file so
 * the VNC desktop terminal (start-command.sh watcher) can open a
 * maximized xfce4-terminal attached to the same tmux session.
 *
 * Runs asynchronously after the sandbox response is sent so it doesn't
 * block the user.
 */
async function createPtyAsync(
  desktop: import("@e2b/desktop").Sandbox,
  chatId: string,
): Promise<void> {
  // Step 1: Start opencode in the existing tmux session (created by startup.sh)
  const tmuxResult = await desktop.commands.run(
    "tmux send-keys -t flowzone-core 'opencode' Enter",
    { timeoutMs: 15_000 },
  )
  if (tmuxResult.exitCode !== 0) {
    logger.warn("Failed to start opencode in tmux, falling back to raw shell", {
      chatId,
      stderr: tmuxResult.stderr,
    })
  }

  // Step 2: Wait for opencode process to appear (up to 20s)
  let opencodeRunning = false
  for (let i = 0; i < 10; i++) {
    const check = await desktop.commands.run(
      "pgrep -x opencode || pgrep -f 'opencode serve' || true",
      { timeoutMs: 5_000 },
    )
    if (check.stdout.trim()) {
      opencodeRunning = true
      break
    }
    await sleep(2_000)
  }

  // Step 3: Create PTY (starts a shell inside the sandbox)
  const pty = await desktop.pty.create({
    cols: 120,
    rows: 40,
    onData: () => {
      // Data is consumed by pty.connect() callers (terminal SSE route)
    },
    timeoutMs: 0,
  })

  // Step 4: Wait for shell to initialize, then attach PTY to tmux
  await sleep(2_000)
  await desktop.pty.sendInput(
    pty.pid,
    new TextEncoder().encode("tmux attach -t flowzone-core\n"),
  )

  // Step 5: Signal readiness — VNC terminal watcher opens xfce4-terminal
  //         on seeing this file; agent also waits for it before prompts
  if (opencodeRunning) {
    await desktop.commands.run("echo 'ready' > /tmp/opencode-ready", {
      timeoutMs: 5_000,
    })
  }

  // Step 6: Persist PTY info
  const { prisma } = await import("@/lib/prisma")
  await prisma.desktopRun.update({
    where: { e2bSandboxId: desktop.sandboxId },
    data: { ptyPid: pty.pid },
  })

  logger.info("PTY created with opencode in tmux", {
    chatId,
    sandboxId: desktop.sandboxId,
    ptyPid: pty.pid,
    opencodeRunning,
  })

  if (!opencodeRunning) {
    logger.warn("opencode did not start in time, PTY attached to raw shell", {
      chatId,
    })
  }
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
    if (isDesktopRunExpired(existing)) {
      await markDesktopRunStopped(options.chatId)
    } else {
      try {
        const { Sandbox } = await import("@e2b/desktop")
        const desktop = await Sandbox.connect(existing.e2bSandboxId)
        await desktop.setTimeout(
          Number(process.env.E2B_DESKTOP_TIMEOUT_MS ?? 300_000),
        )
        await refreshDesktopRunExpiration(options.chatId)
        return {
          sandboxId: existing.e2bSandboxId,
          vncUrl: getVncUrl(desktop),
          ptyPid: existing.ptyPid ?? undefined,
        }
      } catch {
        await killDesktopSandbox(existing.e2bSandboxId)
        await markDesktopRunStopped(options.chatId)
      }
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

  const run = await getDesktopRunBySandboxId(sandboxId)
  if (run?.chatId) {
    await refreshDesktopRunExpiration(run.chatId)
  }
  return {
    sandboxId,
    vncUrl: getVncUrl(desktop),
    ptyPid: run?.ptyPid ?? undefined,
  }
}
