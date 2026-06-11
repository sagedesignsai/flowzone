import type { Sandbox } from "e2b"
import type { SandboxContextValue } from "@/lib/tools/sandbox-store"
import { prisma } from "@/lib/prisma"
import { getInstallationToken } from "@/lib/github"
import { logger } from "@/lib/logger"
import { retryWithTimeout, withTimeout } from "@/lib/retry"
import { dedupeSandboxCreate } from "@/lib/sandbox-cache"

const SANDBOX_TIMEOUT_MS = 600_000
const OPENCODE_TEMPLATE = process.env.E2B_OPENCODE_TEMPLATE ?? "opencode"

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

export type SandboxResult =
  | { ok: true; value: SandboxContextValue }
  | { ok: false; error: CreateSandboxError }

export async function tryCreateSandbox(
  chatId?: string,
): Promise<SandboxResult> {
  if (!process.env.E2B_API_KEY) {
    return {
      ok: false,
      error: { code: "NO_API_KEY", message: "E2B_API_KEY not configured" },
    }
  }

  try {
    const { Sandbox } = await import("e2b")

    // ── Try reconnect first ──────────────────────────────
    if (chatId) {
      const result = await tryReconnect(chatId, Sandbox)
      if (result) return { ok: true, value: result }
    }

    // ── Create new sandbox (deduplicated) ─────────────────
    const key = chatId ?? `__global__`
    const sandbox = await dedupeSandboxCreate(key, () =>
      retryWithTimeout(
        () => Sandbox.create(OPENCODE_TEMPLATE, {
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
      template: OPENCODE_TEMPLATE,
    })

    // ── Persist SandboxRun ───────────────────────────────
    if (chatId) {
      await persistSandboxRun(chatId, sandbox.sandboxId)
    }

    // ── Init git for project-only chats (no imported repo) ─
    let repoPath: string | undefined
    if (chatId) {
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        select: { projectId: true, gitRepoId: true },
      })

      if (chat?.projectId && !chat.gitRepoId) {
        repoPath = `/home/user/project`
        try {
          await sandbox.commands.run(
            `mkdir -p ${repoPath} && cd ${repoPath} && git init && git config user.name "Flowzone Bot" && git config user.email "bot@flowzone.dev"`,
          )

          await prisma.sandboxRun.update({
            where: { chatId },
            data: { repoPath },
          })

          logger.info("Initialized git repo for new project", {
            chatId,
            repoPath,
          })
        } catch (initError) {
          logger.warn("Failed to init git repo in sandbox", {
            chatId,
            error: String(initError),
          })
        }
      }
    }

    return { ok: true, value: { sandbox, repoPath } }
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "TimeoutError"
    const cause = error instanceof Error ? error : undefined
    logger.warn("Failed to create E2B sandbox", {
      chatId,
      error: String(error),
      isTimeout,
    })
    return {
      ok: false,
      error: {
        code: isTimeout ? "TIMEOUT" : "CREATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
        cause,
      },
    }
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

  if (!chat?.sandboxRun?.e2bSandboxId) {
    return null
  }

  // Two reconnect modes:
  //   1. Git-imported chat — needs gitRepo + gitBranch
  //   2. Project-only chat — needs projectId + repoPath on SandboxRun
  const isRepoImport = Boolean(chat.gitRepo && chat.gitBranch)
  const isProjectOnly = Boolean(chat.projectId && chat.sandboxRun.repoPath)

  if (!isRepoImport && !isProjectOnly) {
    return null
  }

  const { sandboxRun, gitRepo, gitBranch } = chat

  try {
    const sandbox = await Sandbox.connect(sandboxRun.e2bSandboxId)
    const repoPath = sandboxRun.repoPath ?? `/home/user/repo/${gitRepo!.fullName}`

    let token: string | undefined

    if (gitRepo) {
      const instId = Number(gitRepo.installationId)
      token = instId
        ? (await withTimeout(
            () => getInstallationToken(instId),
            10_000,
            "getInstallationToken",
          )).token
        : undefined
    }

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

    return { sandbox, repoPath, branch: gitBranch ?? undefined, token }
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
