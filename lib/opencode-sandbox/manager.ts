/**
 * OpenCode Sandbox Manager
 *
 * Manages the OpenCode server lifecycle inside an E2B sandbox.
 * Starts OpenCode as a headless HTTP server, exposes a public URL
 * via sandbox.getHost(), and provides an SDK client for interaction.
 *
 * Architecture:
 *   Flowzone App ←── @opencode-ai/sdk (HTTP) ──→ OpenCode Server ←──→ E2B Sandbox
 *
 * Sandbox lifecycle:
 *   - Started when the first prompt needs it
 *   - Kept alive via periodic setTimeout() calls
 *   - Stopped when the chat session ends
 */

import type { Sandbox } from "e2b"
import type { OpencodeClient } from "@opencode-ai/sdk"

const OPENCODE_PORT = 4096
const HEALTH_CHECK_RETRIES = 60
const HEALTH_CHECK_INTERVAL_MS = 1000

/**
 * How often to extend the sandbox timeout (every 2 minutes).
 * Must be less than SANDBOX_TIMEOUT_MS to prevent premature shutdown.
 */
const KEEPALIVE_INTERVAL_MS = 120_000

/**
 * Sandbox idle timeout (10 minutes). Reset on each keepalive tick
 * and on every prompt request.
 */
const SANDBOX_TIMEOUT_MS = 600_000

export interface OpenCodeManager {
  client: OpencodeClient
  baseUrl: string
  sandboxId: string
  stop: () => Promise<void>
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function ensureOpenCodeRunning(sandbox: Sandbox): Promise<void> {
  const healthResult = await sandbox.commands.run(
    `curl -s -o /dev/null -w "%{http_code}" http://localhost:${OPENCODE_PORT}/global/health`
  )

  if (healthResult.stdout.trim() === "200") {
    return
  }

  await sandbox.commands.run(
    `nohup npx --yes @opencode-ai/cli serve --port ${OPENCODE_PORT} --hostname 0.0.0.0 > /tmp/opencode.log 2>&1 &`
  )

  for (let i = 0; i < HEALTH_CHECK_RETRIES; i++) {
    await sleep(HEALTH_CHECK_INTERVAL_MS)
    const result = await sandbox.commands.run(
      `curl -s -o /dev/null -w "%{http_code}" http://localhost:${OPENCODE_PORT}/global/health`
    )
    if (result.stdout.trim() === "200") return
  }

  throw new Error(
    `OpenCode server failed to start within ${HEALTH_CHECK_RETRIES * HEALTH_CHECK_INTERVAL_MS / 1000}s`
  )
}

export async function createOpenCodeManager(
  sandbox: Sandbox
): Promise<OpenCodeManager> {
  await ensureOpenCodeRunning(sandbox)

  // Extend sandbox timeout to accommodate the OpenCode session
  await sandbox.setTimeout(SANDBOX_TIMEOUT_MS)

  const host = sandbox.getHost(OPENCODE_PORT)
  const baseUrl = `https://${host}`

  const { createOpencodeClient } = await import("@opencode-ai/sdk")
  const client = createOpencodeClient({ baseUrl })

  // Periodically extend sandbox timeout to prevent idle shutdown
  const keepAlive = setInterval(async () => {
    try {
      await sandbox.setTimeout(SANDBOX_TIMEOUT_MS)
    } catch {
      clearInterval(keepAlive)
    }
  }, KEEPALIVE_INTERVAL_MS)

  return {
    client,
    baseUrl,
    sandboxId: sandbox.sandboxId,
    stop: async () => {
      clearInterval(keepAlive)
      await sandbox.commands.run(
        `pkill -f "opencode.*--port ${OPENCODE_PORT}" 2>/dev/null || true`
      )
    },
  }
}
