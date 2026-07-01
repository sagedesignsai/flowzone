/**
 * POST /api/workspace/code-agent/init
 *
 * Initializes the code agent environment on page load, before any
 * messages are sent. Creates (or reuses) an E2B sandbox, starts a
 * PTY shell, and launches opencode TUI inside it.
 *
 * This lets the user see opencode running in the terminal immediately
 * when they arrive on the code-agent page, rather than waiting for
 * the first chat message.
 *
 * Request body: { chatId: string, projectId?: string }
 * Response: { sandboxId: string, ptyPid: number, reused: boolean }
 *   500 { error: string } if no AI provider configured
 *   503 { error: string } if no sandbox available
 */

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { tryCreateSandbox } from "@/lib/chat/sandbox"
import { assertChatOwnership } from "@/lib/chat/access"
import * as ptyManager from "@/lib/pty/pty-manager"
import { registerPtyChatSession } from "@/lib/pty/pty-store"
import { getPrimaryModel } from "@/lib/ai/models"
import { setCachedManager } from "@/lib/sandbox-cache"
import { logger } from "@/lib/logger"

const OPENCODE_PORT = 4096
const OPENCODE_PASSWORD = "opencode-fz-local"
const HEALTH_CHECK_RETRIES = 30
const HEALTH_CHECK_INTERVAL_MS = 1000
const PTY_PID_FILE = "/home/user/.flowzone-pty-pid"

// ── Dedup map (survives Next.js dev HMR) ──────────────────
const GLOBAL_KEY = "__flowzone_codeAgentInits"

function getDedupMap(): Map<string, Promise<Response>> {
  const g = globalThis as Record<string, unknown>
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = new Map()
  return g[GLOBAL_KEY] as Map<string, Promise<Response>>
}

export async function POST(req: Request) {
  // Extract chatId before the heavy handler so dedup works fast
  let chatId: string | undefined
  try {
    const body = (await req.clone().json()) as { chatId?: string }
    chatId = body.chatId
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  if (!chatId) {
    return Response.json({ error: "chatId is required" }, { status: 400 })
  }

  // Dedup in-flight init requests for the same chatId
  const dedupMap = getDedupMap()
  const pending = dedupMap.get(chatId)
  if (pending) return pending

  const promise = handleInit(req, chatId)
  dedupMap.set(chatId, promise)
  promise.finally(() => dedupMap.delete(chatId))
  return promise
}

async function handleInit(req: Request, chatId: string) {
  try {
    // ── Check AI provider ─────────────────────────────────
    const model = getPrimaryModel()
    if (!model) {
      return Response.json(
        {
          error:
            "No AI provider configured. Set AI_PROVIDER and corresponding API key in your environment.",
        },
        { status: 500 },
      )
    }

    // ── Authenticate ──────────────────────────────────────
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ── Verify chat ownership ──────────────────────────────
    try {
      await assertChatOwnership(chatId, session.user.id)
    } catch {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    // ── Create or reuse sandbox ────────────────────────────
    const { projectId: _projectId, ..._rest } = (await req.clone().json()) as {
      projectId?: string
    }
    const sandboxResult = await tryCreateSandbox(chatId)

    if (!sandboxResult.ok) {
      logger.warn("Failed to create sandbox for code-agent init", {
        chatId,
        error: sandboxResult.error?.message,
      })
      return Response.json(
        {
          error:
            "A development sandbox is required. " +
            (sandboxResult.error?.code === "NO_API_KEY"
              ? "Set E2B_API_KEY in your environment."
              : (sandboxResult.error?.message ?? "Please try again later.")),
        },
        { status: 503 },
      )
    }

    const { sandbox, repoPath } = sandboxResult.value
    const sandboxId = sandbox.sandboxId

    // ── Check for existing PTY session (in-memory) ─────────
    const existingMemSession = ptyManager.getPtySession(sandboxId)
    if (existingMemSession && !existingMemSession.destroyed) {
      // PTY already tracked in-memory — re-register for SSE
      registerPtyChatSession(chatId, sandboxId, existingMemSession.pid)
      logger.debug("Init: reusing in-memory PTY session", {
        chatId,
        sandboxId,
        pid: existingMemSession.pid,
      })
      return Response.json({
        sandboxId,
        ptyPid: existingMemSession.pid,
        reused: true,
      })
    }

    // ── Check for persisted PTY PID (survives HMR) ─────────
    // If the PTY process is still alive in the sandbox, reconnect.
    const persistedPtyPid = await readPtyPid(sandbox)
    if (persistedPtyPid !== null) {
      // Reconnect to the existing PTY, check if opencode is already up
      const alreadyRunning = await checkOpencodeHealth(sandbox)
      if (alreadyRunning) {
        registerPtyChatSession(chatId, sandboxId, persistedPtyPid)
        // Create and cache OpenCode client
        await createAndCacheClient(sandbox, sandboxId, chatId, persistedPtyPid)
        logger.info("Init: reconnected to existing PTY + opencode", {
          chatId,
          sandboxId,
          pid: persistedPtyPid,
        })
        return Response.json({
          sandboxId,
          ptyPid: persistedPtyPid,
          reused: true,
        })
      }
      // Stale PID — opencode not running, fall through to create fresh PTY
      logger.debug("Init: found persisted PID but opencode not running", {
        chatId,
        sandboxId,
        pid: persistedPtyPid,
      })
    }

    // ── Create a new PTY shell ─────────────────────────────
    const cwd = repoPath ?? "/home/user"
    const sessionId = await ptyManager.createPtySession(sandbox, {
      cols: 120,
      rows: 40,
      cwd,
      timeoutMs: 0,
    })

    const ptySession = ptyManager.getPtySession(sessionId)
    if (!ptySession) {
      return Response.json(
        { error: "Failed to create PTY session" },
        { status: 500 },
      )
    }

    const ptyPid = ptySession.pid

    // ── Persist PID so subsequent inits can reconnect ──────
    await writePtyPid(sandbox, ptyPid)

    // ── Register for SSE terminal streaming ────────────────
    registerPtyChatSession(chatId, sandboxId, ptyPid)

    // ── Kill existing headless server, then launch TUI ────
    // The sandbox template starts `opencode serve --port 4096`
    // on boot. We kill it first so the TUI can take over port 4096,
    // giving us both a visible TUI and an HTTP server on a known port.
    try {
      await sandbox.commands.run(
        `pkill -f "opencode.*serve.*${OPENCODE_PORT}" 2>/dev/null || true`,
      )
      logger.debug("Init: killed existing opencode serve", {
        chatId,
        sandboxId,
      })
    } catch {
      // Non-fatal: may not exist yet
    }

    try {
      const encoder = new TextEncoder()
      await sandbox.pty.sendInput(
        ptyPid,
        encoder.encode(`opencode --port ${OPENCODE_PORT}\n`),
      )
      logger.debug("Init: launched opencode TUI in PTY", {
        chatId,
        sandboxId,
        ptyPid,
        port: OPENCODE_PORT,
      })
    } catch (launchError) {
      logger.warn("Init: opencode launch may have failed", {
        chatId,
        sandboxId,
        error: String(launchError),
      })
    }

    // ── Wait for opencode HTTP server to be ready ──────────
    const serverReady = await waitForOpencodeHealth(sandbox)

    if (serverReady) {
      await createAndCacheClient(sandbox, sandboxId, chatId, ptyPid)
    } else {
      logger.warn("OpenCode server not ready within timeout", {
        chatId,
        sandboxId,
        timeoutSec:
          (HEALTH_CHECK_RETRIES * HEALTH_CHECK_INTERVAL_MS) / 1000,
      })
      // Agent tools will retry the health check if needed
    }

    logger.info("Init: code agent environment ready", {
      chatId,
      sandboxId,
      ptyPid,
      serverReady,
    })

    return Response.json({
      sandboxId,
      ptyPid,
      reused: false,
      serverReady,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    logger.error("POST /api/workspace/code-agent/init error", {
      error: message,
    })
    return Response.json({ error: message }, { status: 500 })
  }
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Build the curl health-check command for the opencode server.
 */
function healthCmd(): string {
  return [
    "curl",
    "-s",
    "--max-time",
    "5",
    "-o",
    "/dev/null",
    "-w",
    '"%{http_code}"',
    "-u",
    `opencode:${OPENCODE_PASSWORD}`,
    `http://localhost:${OPENCODE_PORT}/global/health`,
    "|| true",
  ].join(" ")
}

/**
 * Quick one-shot health check (no retries).
 */
async function checkOpencodeHealth(sandbox: {
  commands: { run: (cmd: string) => Promise<{ stdout: string }> }
}): Promise<boolean> {
  try {
    const result = await sandbox.commands.run(healthCmd())
    return result.stdout.trim() === "200"
  } catch {
    return false
  }
}

/**
 * Poll health endpoint with retries until ready or timeout.
 */
async function waitForOpencodeHealth(sandbox: {
  commands: { run: (cmd: string) => Promise<{ stdout: string }> }
}): Promise<boolean> {
  for (let i = 0; i < HEALTH_CHECK_RETRIES; i++) {
    if (await checkOpencodeHealth(sandbox)) return true
    await new Promise((resolve) =>
      setTimeout(resolve, HEALTH_CHECK_INTERVAL_MS),
    )
  }
  return false
}

/**
 * Read persisted PTY PID from sandbox filesystem.
 * Returns null if file doesn't exist or has invalid content.
 */
async function readPtyPid(sandbox: {
  files: { read: (path: string) => Promise<string> }
}): Promise<number | null> {
  try {
    const content = await sandbox.files.read(PTY_PID_FILE)
    const pid = parseInt(content.trim(), 10)
    return isNaN(pid) ? null : pid
  } catch {
    return null
  }
}

/**
 * Write PTY PID to sandbox filesystem for reconnection across HMR.
 */
async function writePtyPid(
  sandbox: { files: { write: (path: string, data: string) => Promise<void> } },
  pid: number,
): Promise<void> {
  try {
    await sandbox.files.write(PTY_PID_FILE, String(pid))
  } catch {
    // Non-fatal: best-effort persistence
  }
}

/**
 * Create and cache the OpenCode SDK client + register server info.
 */
async function createAndCacheClient(
  sandbox: {
    getHost: (port: number) => string
  },
  sandboxId: string,
  chatId: string,
  ptyPid: number,
): Promise<void> {
  try {
    const authHeader = `Basic ${Buffer.from(`opencode:${OPENCODE_PASSWORD}`).toString("base64")}`
    const host = sandbox.getHost(OPENCODE_PORT)
    const baseUrl = `https://${host}`

    const { createOpencodeClient } = await import("@opencode-ai/sdk/v2")
    const client = createOpencodeClient({
      baseUrl,
      headers: { Authorization: authHeader },
    })

    setCachedManager(sandboxId, {
      client,
      baseUrl,
      sandboxId,
      stop: async () => {},
    })

    // Store server info in pty-store for agent tools
    registerPtyChatSession(chatId, sandboxId, ptyPid, {
      baseUrl,
      authHeader,
    })

    logger.info("OpenCode client cached for agent tools", {
      chatId,
      sandboxId,
    })
  } catch (clientError) {
    logger.warn("Failed to create OpenCode client", {
      chatId,
      sandboxId,
      error: String(clientError),
    })
  }
}
