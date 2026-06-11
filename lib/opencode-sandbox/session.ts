import type { OpencodeClient, PermissionRuleset } from "@opencode-ai/sdk/v2"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { retryWithTimeout } from "@/lib/retry"

const opencodeSessionMap = new Map<string, string>()

export interface ResolvedSession {
  sessionId: string
  isNew: boolean
}

export interface ResolveOpenCodeSessionOptions {
  directory?: string
  title?: string
  agent?: string
  /** Model to use — shape matches v2 session.create model parameter */
  model?: {
    id: string
    providerID: string
    variant?: string
  }
  permission?: PermissionRuleset
}

export const DEFAULT_OPENCODE_PERMISSION_RULES: PermissionRuleset = [
  { permission: "read", pattern: "*", action: "allow" },
  { permission: "list", pattern: "*", action: "allow" },
  { permission: "glob", pattern: "*", action: "allow" },
  { permission: "grep", pattern: "*", action: "allow" },
  { permission: "edit", pattern: "*", action: "allow" },
  { permission: "bash", pattern: "*", action: "allow" },
  { permission: "webfetch", pattern: "*", action: "allow" },
  { permission: "task", pattern: "*", action: "allow" },
]

/**
 * Default model for OpenCode sessions when none is specified.
 * When undefined, the OpenCode server uses its own default model.
 */
export type OpenCodeModel = {
  providerID: string
  modelID: string
}
export const DEFAULT_OPENCODE_MODEL: OpenCodeModel | undefined = undefined

export async function resolveOpenCodeSession(
  client: OpencodeClient,
  chatId: string,
  options: ResolveOpenCodeSessionOptions = {},
): Promise<ResolvedSession> {
  let sessionId = opencodeSessionMap.get(chatId)

  if (!sessionId) {
    sessionId = await lookupPersistedSession(chatId)
  }

  if (sessionId) {
    const knownSessionId = sessionId
    const exists = await retryWithTimeout(
      async () => {
        const getResult = await client.session.get({
          sessionID: knownSessionId,
          ...(options.directory ? { directory: options.directory } : {}),
        })
        return !!getResult.data
      },
      10_000,
      "session.get",
      { maxAttempts: 2, baseDelayMs: 500 },
    )

    if (!exists) {
      logger.warn("Cached OpenCode session not found on server, creating new", {
        chatId,
        sessionId,
      })
      sessionId = undefined
    }
  }

  if (!sessionId) {
    const sessionData = await retryWithTimeout(
      async () => {
        const createResult = await client.session.create({
          title: options.title ?? "Flowzone Chat",
          ...(options.directory ? { directory: options.directory } : {}),
          ...(options.agent ? { agent: options.agent } : {}),
          ...(options.model ? { model: options.model } : {}),
          permission: options.permission ?? DEFAULT_OPENCODE_PERMISSION_RULES,
        })
        if (!createResult.data) {
          throw new Error("Session create returned no data")
        }
        return createResult.data
      },
      15_000,
      "session.create",
    )

    sessionId = sessionData.id
    opencodeSessionMap.set(chatId, sessionId)
    persistSessionMapping(chatId, sessionId).catch((err) => {
      logger.warn("Failed to persist session mapping", {
        chatId,
        sessionId,
        error: String(err),
      })
    })
    return { sessionId, isNew: true }
  }

  return { sessionId, isNew: false }
}

async function lookupPersistedSession(
  chatId: string,
): Promise<string | undefined> {
  try {
    const run = await prisma.sandboxRun.findUnique({
      where: { chatId },
      select: { metadata: true },
    })
    if (!run?.metadata) return undefined

    const meta = run.metadata as Record<string, unknown>
    if (typeof meta.opencodeSessionId === "string") {
      logger.debug("Found persisted session ID", {
        chatId,
        sessionId: meta.opencodeSessionId,
      })
      return meta.opencodeSessionId
    }
  } catch (error) {
    logger.warn("Failed to lookup persisted session", {
      chatId,
      error: String(error),
    })
  }
  return undefined
}

async function persistSessionMapping(
  chatId: string,
  sessionId: string,
): Promise<void> {
  try {
    const run = await prisma.sandboxRun.findUnique({ where: { chatId } })
    if (run) {
      await prisma.sandboxRun.update({
        where: { id: run.id },
        data: {
          metadata: {
            ...(run.metadata as Record<string, unknown>),
            opencodeSessionId: sessionId,
          },
        },
      })
    }
  } catch (error) {
    logger.warn("Failed to persist session mapping", {
      chatId,
      sessionId,
      error: String(error),
    })
  }
}
