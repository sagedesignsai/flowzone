/**
 * Terminal Session Store
 *
 * In-memory store for active terminal connections by chat ID.
 * Holds sandbox connection metadata so SSE streams and input
 * endpoints share the same PTY connection.
 */
import { getDesktopRunForChat } from "@/lib/desktop/persistence"
import { assertChatAccess } from "@/lib/desktop/auth"

interface TerminalSession {
  chatId: string
  sandboxId: string
  ptyPid: number
}

const sessions = new Map<string, TerminalSession>()

/**
 * Register a terminal session for a chat.
 */
export function registerTerminalSession(
  chatId: string,
  sandboxId: string,
  ptyPid: number,
): void {
  sessions.set(chatId, { chatId, sandboxId, ptyPid })
}

/**
 * Unregister a terminal session for a chat.
 */
export function unregisterTerminalSession(chatId: string): void {
  sessions.delete(chatId)
}

/**
 * Get the terminal session for a chat, verifying ownership.
 * Lazily resolves from DB on first access.
 */
export async function getTerminalSession(
  chatId: string,
  userId: string,
): Promise<TerminalSession | null> {
  const existing = sessions.get(chatId)
  if (existing) return existing

  await assertChatAccess(userId, chatId)

  const run = await getDesktopRunForChat(chatId)
  if (!run?.ptyPid) return null

  const session: TerminalSession = {
    chatId,
    sandboxId: run.e2bSandboxId,
    ptyPid: run.ptyPid,
  }

  sessions.set(chatId, session)
  return session
}
