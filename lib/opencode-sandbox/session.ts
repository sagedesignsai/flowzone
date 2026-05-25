import type { OpencodeClient } from "@opencode-ai/sdk"
import { prisma } from "@/lib/prisma"

// Maps Flowzone chatId → OpenCode session ID.
// Lives in memory since OpenCode server is tied to the E2B sandbox lifecycle.
const opencodeSessionMap = new Map<string, string>()

/**
 * Resolve or create an OpenCode session for the given chat.
 *
 * Lookup order:
 *   1. In-memory map (fastest — survives within a server instance)
 *   2. SandboxRun.metadata (persisted — survives server restarts)
 *   3. Create a new OpenCode session
 */
export async function resolveOpenCodeSession(
  client: OpencodeClient,
  chatId: string,
): Promise<string> {
  let sessionId = opencodeSessionMap.get(chatId)

  if (!sessionId) {
    sessionId = await lookupPersistedSession(chatId)
  }

  if (sessionId) {
    const getResult = await client.session.get({
      path: { id: sessionId },
    })
    if (!getResult.data) {
      sessionId = undefined
    }
  }

  if (!sessionId) {
    const createResult = await client.session.create({
      body: { title: "Flowzone Chat" },
    })
    if (!createResult.data) {
      throw new Error("Failed to create OpenCode session")
    }
    sessionId = createResult.data.id
    opencodeSessionMap.set(chatId, sessionId)
    await persistSessionMapping(chatId, sessionId)
  }

  return sessionId
}

async function lookupPersistedSession(
  chatId: string,
): Promise<string | undefined> {
  try {
    const run = await prisma.sandboxRun.findUnique({
      where: { chatId },
      select: { metadata: true },
    })
    const meta = (run?.metadata ?? {}) as Record<string, unknown>
    if (typeof meta.opencodeSessionId === "string") {
      return meta.opencodeSessionId
    }
  } catch {
    // ignore
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
  } catch {
    // non-critical — in-memory map is sufficient for sandbox lifetime
  }
}
