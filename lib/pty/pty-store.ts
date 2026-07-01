/**
 * PTY Chat Store
 *
 * Maps chat IDs to active PTY terminal sessions for direct sandbox PTY
 * reconnection. Unlike pty-manager (keyed by sandboxId for AI tools),
 * this store is keyed by chatId for the real-time terminal panel.
 *
 * The SSE terminal endpoint looks up the sandboxId + ptyPid here, then
 * connects directly to the sandbox PTY via sandbox.pty.connect().
 * No EventEmitter needed — the connection streams output directly.
 */

// ── Types ─────────────────────────────────────────────────

export interface PtyChatSession {
  /** The E2B sandbox ID */
  sandboxId: string
  /** The PTY process ID inside the sandbox */
  ptyPid: number
  /** When the session was registered */
  createdAt: number
  /** Public HTTPS URL for the opencode HTTP server (via sandbox.getHost) */
  baseUrl?: string
  /** Basic auth header for opencode server requests */
  authHeader?: string
}

// ── Store ─────────────────────────────────────────────────

const sessions = new Map<string, PtyChatSession>()

// ── Validation ────────────────────────────────────────────

const MAX_SESSION_AGE_MS = 30 * 60 * 1000 // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // Every 5 minutes

// Periodic cleanup of stale sessions
setInterval(() => {
  const now = Date.now()
  for (const [chatId, session] of sessions) {
    if (now - session.createdAt > MAX_SESSION_AGE_MS) {
      sessions.delete(chatId)
    }
  }
}, CLEANUP_INTERVAL_MS)

// ── API ───────────────────────────────────────────────────

/**
 * Register a PTY session for a chat.
 * The SSE terminal endpoint will connect directly to the sandbox
 * PTY using these credentials.
 *
 * Optionally accepts baseUrl and authHeader for the opencode HTTP server,
 * so agent tools can create an SDK client without re-discovery.
 */
export function registerPtyChatSession(
  chatId: string,
  sandboxId: string,
  ptyPid: number,
  options?: { baseUrl?: string; authHeader?: string },
): PtyChatSession {
  // Clean up existing session for this chat if any
  const existing = sessions.get(chatId)
  if (existing) {
    sessions.delete(chatId)
  }

  const session: PtyChatSession = {
    sandboxId,
    ptyPid,
    createdAt: Date.now(),
    ...(options?.baseUrl ? { baseUrl: options.baseUrl } : {}),
    ...(options?.authHeader ? { authHeader: options.authHeader } : {}),
  }

  sessions.set(chatId, session)
  return session
}

/**
 * Unregister a PTY session for a chat.
 */
export function unregisterPtyChatSession(chatId: string): void {
  sessions.delete(chatId)
}

/**
 * Get the PTY session for a chat.
 */
export function getPtyChatSession(
  chatId: string,
): PtyChatSession | undefined {
  return sessions.get(chatId)
}
