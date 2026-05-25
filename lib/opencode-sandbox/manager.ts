import type { Sandbox } from "e2b"
import type { OpencodeClient } from "@opencode-ai/sdk"
import { logger } from "@/lib/logger"
import { getCachedManager, setCachedManager, deleteCachedManager } from "@/lib/sandbox-cache"

const OPENCODE_PORT = 4096
const HEALTH_CHECK_RETRIES = 60
const HEALTH_CHECK_INTERVAL_MS = 1000

const KEEPALIVE_INTERVAL_MS = 120_000
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

function derivePassword(sandboxId: string): string {
  let hash = 5381
  for (let i = 0; i < sandboxId.length; i++) {
    hash = ((hash << 5) + hash) + sandboxId.charCodeAt(i)
  }
  return Math.abs(hash).toString(36).padStart(12, "0") + "fz"
}

function getAuthHeader(password: string): string {
  const user = "opencode"
  const encoded = btoa(`${user}:${password}`)
  return `Basic ${encoded}`
}

function generateOpenCodeConfig(): string {
  return JSON.stringify(
    {
      $schema: "https://opencode.ai/config.json",
      permission: { "*": "allow" },
      autoupdate: "notify",
      share: "disabled",
    },
    null,
    2,
  )
}

async function provisionOpenCodeConfig(sandbox: Sandbox): Promise<void> {
  await sandbox.files.write("/home/user/opencode.json", generateOpenCodeConfig())
}

async function ensureOpenCodeRunning(
  sandbox: Sandbox,
  password: string,
): Promise<void> {
  const healthResult = await sandbox.commands.run(
    `curl -s --max-time 5 -o /dev/null -w "%{http_code}" http://localhost:${OPENCODE_PORT}/global/health`,
  )

  if (healthResult.stdout.trim() === "200") {
    logger.debug("OpenCode server already running", { sandboxId: sandbox.sandboxId })
    return
  }

  await provisionOpenCodeConfig(sandbox)

  // Write password to a file instead of embedding in the command line (ps leak)
  await sandbox.files.write("/tmp/opencode_password", password)

  await sandbox.commands.run(
    `nohup sh -c '
      PASSWORD=$(cat /tmp/opencode_password)
      export OPENCODE_SERVER_PASSWORD="$PASSWORD"
      npx --yes @opencode-ai/cli serve --port ${OPENCODE_PORT} --hostname 0.0.0.0
    ' > /tmp/opencode.log 2>&1 &`,
  )

  for (let i = 0; i < HEALTH_CHECK_RETRIES; i++) {
    await sleep(HEALTH_CHECK_INTERVAL_MS)
    const result = await sandbox.commands.run(
      `curl -s --max-time 5 -o /dev/null -w "%{http_code}" http://localhost:${OPENCODE_PORT}/global/health`,
    )
    if (result.stdout.trim() === "200") {
      logger.info("OpenCode server started", {
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

  const password = derivePassword(sandboxId)
  const authHeader = getAuthHeader(password)

  await ensureOpenCodeRunning(sandbox, password)

  await sandbox.setTimeout(SANDBOX_TIMEOUT_MS)

  const host = sandbox.getHost(OPENCODE_PORT)
  const baseUrl = `https://${host}`

  const { createOpencodeClient } = await import("@opencode-ai/sdk")
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
