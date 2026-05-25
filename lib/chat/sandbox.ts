import type { Sandbox } from "e2b"
import type { SandboxContextValue } from "@/lib/tools/sandbox-store"
import { prisma } from "@/lib/prisma"
import { getInstallationToken } from "@/lib/github"
import { logger } from "@/lib/logger"
import { retryWithTimeout, withTimeout } from "@/lib/retry"
import { dedupeSandboxCreate } from "@/lib/sandbox-cache"

const SANDBOX_TIMEOUT_MS = 600_000

const PROVIDER_ENV_PREFIXES = [
  "ANTHROPIC_",
  "OPENAI_",
  "XAI_",
  "AI_GATEWAY_",
  "OPENROUTER_",
  "ALIBABA_",
  "GOOGLE_",
  "MISTRAL_",
  "GROQ_",
  "TOGETHER_",
  "DEEPSEEK_",
  "PERPLEXITY_",
  "COHERE_",
  "AZURE_",
  "REPLICATE_",
  "HUGGINGFACE_",
  "FIRECRAWL_",
  "TAVILY_",
  "SERPER_",
  "CONTEXT_7_",
  "EXA_",
  "SMITHERY_",
  "COMPOSIO_",
  "E2B_",
]

function collectSandboxEnvs(): Record<string, string> {
  const envs: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (value && PROVIDER_ENV_PREFIXES.some((p) => key.startsWith(p))) {
      envs[key] = value
    }
  }
  return envs
}

export interface CreateSandboxError {
  code: "NO_API_KEY" | "CREATE_FAILED" | "RECONNECT_FAILED" | "TIMEOUT"
  message: string
  cause?: unknown
}

export async function tryCreateSandbox(
  chatId?: string,
): Promise<SandboxContextValue | null> {
  if (!process.env.E2B_API_KEY) {
    logger.debug("No E2B_API_KEY configured, skipping sandbox")
    return null
  }

  try {
    const { Sandbox } = await import("e2b")

    // ── Try reconnect first ──────────────────────────────
    if (chatId) {
      const result = await tryReconnect(chatId, Sandbox)
      if (result) return result
    }

    // ── Create new sandbox (deduplicated) ─────────────────
    const key = chatId ?? `__global__`
    const sandbox = await dedupeSandboxCreate(key, () =>
      retryWithTimeout(
        () => Sandbox.create({
          envs: collectSandboxEnvs(),
          timeoutMs: SANDBOX_TIMEOUT_MS,
        }),
        30_000,
        "Sandbox.create",
        { maxAttempts: 2, baseDelayMs: 1_000 },
      ),
    )

    logger.info("Sandbox created", {
      sandboxId: sandbox.sandboxId,
      chatId,
    })

    // ── Persist SandboxRun ───────────────────────────────
    if (chatId) {
      await persistSandboxRun(chatId, sandbox.sandboxId)
    }

    return { sandbox }
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "TimeoutError"
    logger.warn("Failed to create E2B sandbox", {
      chatId,
      error: String(error),
      isTimeout,
    })
    return null
  }
}

async function tryReconnect(
  chatId: string,
  Sandbox: typeof import("e2b")["Sandbox"],
): Promise<SandboxContextValue | null> {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { gitRepo: true, sandboxRun: true },
  })

  if (!chat?.sandboxRun?.e2bSandboxId || !chat.gitRepo || !chat.gitBranch) {
    return null
  }

  const { sandboxRun, gitRepo, gitBranch } = chat

  try {
    const sandbox = await Sandbox.connect(sandboxRun.e2bSandboxId)
    const repoPath = sandboxRun.repoPath ?? `/home/user/repo/${gitRepo.fullName}`

    const instId = Number(gitRepo.installationId)
    const token = instId
      ? (await withTimeout(
          () => getInstallationToken(instId),
          10_000,
          "getInstallationToken",
        )).token
      : undefined

    await prisma.sandboxRun.update({
      where: { id: sandboxRun.id },
      data: {
        status: "running",
        expiresAt: new Date(Date.now() + SANDBOX_TIMEOUT_MS),
      },
    })

    logger.info("Reconnected to existing sandbox", {
      sandboxId: sandbox.sandboxId,
      chatId,
    })

    return { sandbox, repoPath, branch: gitBranch, token }
  } catch (error) {
    logger.warn("Failed to reconnect sandbox, will create new", {
      chatId,
      sandboxId: sandboxRun.e2bSandboxId,
      error: String(error),
    })

    await prisma.sandboxRun.update({
      where: { id: sandboxRun.id },
      data: { status: "stopped" },
    })

    return null
  }
}

async function persistSandboxRun(
  chatId: string,
  e2bSandboxId: string,
): Promise<void> {
  try {
    await prisma.sandboxRun.upsert({
      where: { chatId },
      update: {
        e2bSandboxId,
        status: "running",
        expiresAt: new Date(Date.now() + SANDBOX_TIMEOUT_MS),
      },
      create: {
        chatId,
        e2bSandboxId,
        status: "running",
        expiresAt: new Date(Date.now() + SANDBOX_TIMEOUT_MS),
      },
    })
  } catch (error) {
    // Non-critical: sandbox works without DB persistence
    logger.warn("Failed to persist SandboxRun", {
      chatId,
      e2bSandboxId,
      error: String(error),
    })
  }
}
