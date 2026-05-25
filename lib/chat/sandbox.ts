import type { Sandbox } from "e2b"
import type { SandboxContextValue } from "@/lib/tools/sandbox-store"
import { prisma } from "@/lib/prisma"
import { getInstallationToken } from "@/lib/github"

// ── Provider env vars to forward to sandbox ──────────────

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

// ── Sandbox creation with context bridging ─────────────────

/**
 * Try to create or reconnect to an E2B sandbox for a chat session.
 *
 * Bridge fix (BRIDGE-001): If the chat has an existing SandboxRun with
 * an e2bSandboxId, repoPath, and gitBranch, we reconnect to that sandbox
 * and populate the full context (including a fresh token) so agent tools
 * can operate on the cloned repo.
 *
 * If no existing sandbox exists, creates a new blank one.
 */
export async function tryCreateSandbox(
  chatId?: string,
): Promise<SandboxContextValue | null> {
  if (!process.env.E2B_API_KEY) return null

  try {
    const { Sandbox } = await import("e2b")

    // ── Check for existing sandbox with repo context ──────────
    if (chatId) {
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { gitRepo: true, sandboxRun: true },
      })

      if (chat?.sandboxRun?.e2bSandboxId && chat.gitRepo && chat.gitBranch) {
        const { sandboxRun, gitRepo, gitBranch } = chat

        try {
          // Try to reconnect to the existing sandbox
          const sandbox = await Sandbox.connect(sandboxRun.e2bSandboxId)
          const repoPath =
            sandboxRun.repoPath ?? `/home/user/repo/${gitRepo.fullName}`

          // Get a fresh installation token (tokens are short-lived)
          const instId = Number(gitRepo.installationId)
          const token = instId
            ? (await getInstallationToken(instId)).token
            : undefined

          return {
            sandbox,
            repoPath,
            branch: gitBranch,
            token,
          }
        } catch {
          // Sandbox expired or unavailable — fall through to create new
          await prisma.sandboxRun.update({
            where: { id: sandboxRun.id },
            data: { status: "stopped" },
          })
        }
      }
    }

    // ── No existing sandbox — create a new one ──────────
    // Forward AI provider env vars so OpenCode can use them
    const sandbox = await Sandbox.create({
      envs: collectSandboxEnvs(),
      timeoutMs: 600_000, // 10 minutes; extended by keep-alive
    })
    return { sandbox }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn("Failed to create E2B sandbox:", message)
    return null
  }
}
