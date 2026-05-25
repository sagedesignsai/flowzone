import type { OpencodeClient } from "@opencode-ai/sdk"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { retryWithTimeout } from "@/lib/retry"

const opencodeSessionMap = new Map<string, string>()

export interface ResolvedSession {
  sessionId: string
  isNew: boolean
}

export async function resolveOpenCodeSession(
  client: OpencodeClient,
  chatId: string,
): Promise<ResolvedSession> {
  let sessionId = opencodeSessionMap.get(chatId)

  if (!sessionId) {
    sessionId = await lookupPersistedSession(chatId)
  }

  if (sessionId) {
    const exists = await retryWithTimeout(
      async () => {
        const getResult = await client.session.get({
          path: { id: sessionId },
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
          body: { title: "Flowzone Chat" },
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
