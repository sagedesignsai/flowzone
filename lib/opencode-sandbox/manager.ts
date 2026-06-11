import type { Sandbox } from "e2b"
import type { OpencodeClient } from "@opencode-ai/sdk/v2"
import { logger } from "@/lib/logger"
import { getCachedManager, setCachedManager, deleteCachedManager } from "@/lib/sandbox-cache"

const OPENCODE_PORT = 4096
const HEALTH_CHECK_RETRIES = 10
const HEALTH_CHECK_INTERVAL_MS = 1000

const KEEPALIVE_INTERVAL_MS = 120_000
const SANDBOX_TIMEOUT_MS = 600_000
const OPENCODE_PASSWORD = "opencode-fz-local"

export interface OpenCodeManager {
  client: OpencodeClient
  baseUrl: string
  sandboxId: string
  stop: () => Promise<void>
}

function getAuthHeader(password: string): string {
  const user = "opencode"
  const encoded = btoa(`${user}:${password}`)
  return `Basic ${encoded}`
}

function healthCheckCurl(port: number): string {
  return `curl -s --max-time 5 -o /dev/null -w "%{http_code}" -u opencode:${OPENCODE_PASSWORD} http://localhost:${port}/global/health || true`
}

async function waitForOpenCodeServer(sandbox: Sandbox): Promise<void> {
  const curlCmd = healthCheckCurl(OPENCODE_PORT)

  logger.info("Waiting for OpenCode server", {
    sandboxId: sandbox.sandboxId,
    expectedPort: OPENCODE_PORT,
  })

  // Phase 1: server should be running via template setStartCmd
  for (let i = 0; i < HEALTH_CHECK_RETRIES; i++) {
    const result = await sandbox.commands.run(curlCmd)
    const code = result.stdout.trim()
    if (code === "200") {
      if (i > 0) {
        logger.info("OpenCode server ready", {
          sandboxId: sandbox.sandboxId,
          attempts: i + 1,
        })
      }
      return
    }
    logger.debug("OpenCode health check (phase 1)", {
      sandboxId: sandbox.sandboxId,
      attempt: i + 1,
      statusCode: code || "(empty)",
    })
    await new Promise((resolve) => setTimeout(resolve, HEALTH_CHECK_INTERVAL_MS))
  }

  // Phase 2: fallback — start server at runtime
  logger.warn("OpenCode server not detected — attempting to start at runtime", {
    sandboxId: sandbox.sandboxId,
    port: OPENCODE_PORT,
  })
  await sandbox.commands.run(
    `opencode serve --port ${OPENCODE_PORT} --hostname 0.0.0.0`,
    { background: true, envs: { OPENCODE_SERVER_PASSWORD: OPENCODE_PASSWORD } },
  )

  for (let i = 0; i < HEALTH_CHECK_RETRIES; i++) {
    await new Promise((resolve) => setTimeout(resolve, HEALTH_CHECK_INTERVAL_MS))
    const result = await sandbox.commands.run(curlCmd)
    const code = result.stdout.trim()
    logger.info("OpenCode health check (fallback)", {
      sandboxId: sandbox.sandboxId,
      attempt: i + 1,
      statusCode: code || "(empty)",
    })
    if (code === "200") {
      logger.info("OpenCode server started (runtime fallback)", {
        sandboxId: sandbox.sandboxId,
        attempts: i + 1,
      })
      return
    }
  }

  throw new Error(
    `OpenCode server failed to start within ${HEALTH_CHECK_RETRIES * HEALTH_CHECK_INTERVAL_MS / 1000}s`,
  )
}

export async function createOpenCodeManager(
  sandbox: Sandbox,
): Promise<OpenCodeManager> {
  const sandboxId = sandbox.sandboxId

  // Return cached manager if available
  const cached = getCachedManager(sandboxId)
  if (cached) {
    logger.debug("Reusing cached OpenCodeManager", { sandboxId })
    return cached
  }

  const authHeader = getAuthHeader(OPENCODE_PASSWORD)

  await waitForOpenCodeServer(sandbox)

  await sandbox.setTimeout(SANDBOX_TIMEOUT_MS)

  const host = sandbox.getHost(OPENCODE_PORT)
  const baseUrl = `https://${host}`

  const { createOpencodeClient } = await import("@opencode-ai/sdk/v2")
  const client = createOpencodeClient({
    baseUrl,
    headers: { Authorization: authHeader },
  })

  const keepAlive = setInterval(async () => {
    try {
      await sandbox.setTimeout(SANDBOX_TIMEOUT_MS)
    } catch {
      clearInterval(keepAlive)
    }
  }, KEEPALIVE_INTERVAL_MS)

  const manager: OpenCodeManager = {
    client,
    baseUrl,
    sandboxId,
    stop: async () => {
      clearInterval(keepAlive)
      deleteCachedManager(sandboxId)
      await sandbox.commands.run(
        `pkill -f "opencode.*--port ${OPENCODE_PORT}" 2>/dev/null || true`,
      )
    },
  }

  setCachedManager(sandboxId, manager)
  return manager
}
