/**
 * PTY Session Manager
 *
 * Manages E2B sandbox PTY sessions in-memory. Provides:
 * - Creation/destruction of PTY sessions
 * - Output buffering
 * - Pattern matching with streaming output
 * - Session lifecycle cleanup
 *
 * PTY sessions are keyed by sandboxId (one PTY per sandbox).
 * Tools access the manager via these functions, but call
 * sandbox.pty.sendInput() / resize() directly since they
 * have the sandbox from SandboxContext.
 */

import { stripVTControlCharacters } from "node:util"
import type { Sandbox } from "e2b"
import { logger } from "@/lib/logger"

// ── Types ─────────────────────────────────────────────────

export interface PtySessionState {
  /** The sandboxId (also used as the session key) */
  sessionId: string
  /** E2B PTY process ID */
  pid: number
  /** The CommandHandle returned by pty.create() */
  handle: import("e2b").CommandHandle
  /** Accumulated output buffer (list of chunks) */
  buffer: string[]
  /** Sandbox this PTY belongs to */
  sandboxId: string
  /** When the PTY was created */
  createdAt: number
  /** Timestamp of last activity */
  lastActivity: number
  /** Whether the session has been killed */
  destroyed: boolean
}

export interface PtyCreateOptions {
  cols?: number
  rows?: number
  cwd?: string
  /** Default: 0 (no timeout) */
  timeoutMs?: number
  /** Default: sandbox user */
  user?: string
  envs?: Record<string, string>
  /** External callback fired on each output chunk (alongside buffer append) */
  onData?: (text: string) => void
}

export interface PtyPatternMatchOptions {
  /** Pattern to search for (substring match) */
  pattern: string
  /** Max time to wait in ms (default: 120000) */
  timeout?: number
  /** Check interval in ms (default: 100) */
  interval?: number
}

// ── Errors ────────────────────────────────────────────────

export class PtyTimeoutError extends Error {
  public readonly pattern: string
  public readonly timeout: number
  public readonly output: string

  constructor(
    message: string,
    pattern: string,
    timeout: number,
    output: string,
  ) {
    super(message)
    this.name = "PtyTimeoutError"
    this.pattern = pattern
    this.timeout = timeout
    this.output = output
  }
}

// ── Store ─────────────────────────────────────────────────

const sessions = new Map<string, PtySessionState>()

// ── Session Lifecycle ─────────────────────────────────────

/**
 * Get a PTY session by sandbox ID.
 */
export function getPtySession(sandboxId: string): PtySessionState | undefined {
  return sessions.get(sandboxId)
}

/**
 * Create a PTY session in the given sandbox.
 * Starts an interactive bash shell with TERM=xterm-256color.
 * Returns the session's sandboxId (the lookup key).
 *
 * The tools use sandbox.pty.sendInput(pid, data) directly
 * for sending input. Use readPtyOutput() to read the buffer.
 */
export async function createPtySession(
  sandbox: Sandbox,
  options: PtyCreateOptions = {},
): Promise<string> {
  const sandboxId = sandbox.sandboxId

  // Destroy existing session if any
  const existing = sessions.get(sandboxId)
  if (existing && !existing.destroyed) {
    await destroyPtySession(sandboxId)
  }

  const buffer: string[] = []

  const handle = await sandbox.pty.create({
    cols: options.cols ?? 120,
    rows: options.rows ?? 40,
    onData: (data: Uint8Array) => {
      const text = new TextDecoder().decode(data)
      buffer.push(text)
      options.onData?.(text)
    },
    timeoutMs: options.timeoutMs ?? 0,
    cwd: options.cwd,
    user: options.user,
    envs: options.envs,
  })

  const session: PtySessionState = {
    sessionId: sandboxId,
    pid: handle.pid,
    handle,
    buffer,
    sandboxId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    destroyed: false,
  }

  sessions.set(sandboxId, session)

  logger.debug("PTY session created", {
    sandboxId,
    pid: handle.pid,
  })

  return sandboxId
}

/**
 * Destroy (kill) a PTY session and clean up.
 */
export async function destroyPtySession(sandboxId: string): Promise<void> {
  const session = sessions.get(sandboxId)
  if (!session || session.destroyed) return

  session.destroyed = true

  try {
    await session.handle.kill()
  } catch (error) {
    logger.warn("Failed to kill PTY", {
      sandboxId,
      pid: session.pid,
      error: String(error),
    })
  }

  sessions.delete(sandboxId)

  logger.debug("PTY session destroyed", { sandboxId, pid: session.pid })
}

// ── Buffer Operations ────────────────────────────────────

/**
 * Read the entire accumulated output buffer for a PTY session.
 * Includes shell prompts, echoed input, and command output.
 */
export function readPtyOutput(sandboxId: string): string {
  const session = getActiveSession(sandboxId)
  return session.buffer.join("")
}

/**
 * Read output since the given character index.
 * Returns the new text and the updated index.
 */
export function readPtyOutputSince(
  sandboxId: string,
  sinceIndex: number,
): { text: string; newIndex: number } {
  const session = getActiveSession(sandboxId)
  const current = session.buffer.join("")
  const newText = current.slice(sinceIndex)
  return { text: newText, newIndex: current.length }
}

/**
 * Clear the output buffer for a PTY session.
 */
export function clearPtyOutput(sandboxId: string): void {
  const session = getActiveSession(sandboxId)
  session.buffer.length = 0
  session.lastActivity = Date.now()
}

// ── Pattern Matching ─────────────────────────────────────

/**
 * Async generator that yields terminal output deltas while
 * waiting for a substring pattern in the PTY output.
 *
 * Each yield is `{ delta, fullOutput }` — delta being the
 * newly arrived text since the last yield.
 *
 * Resolves when the pattern is found in the accumulated output.
 * Throws PtyTimeoutError if pattern not found within timeout.
 *
 * Usage in a tool's generator execute:
 *   for await (const { delta } of waitForPtyPattern(sandboxId, { pattern: "ready" })) {
 *     yield { type: "text-delta" as const, delta }
 *   }
 *   const output = readPtyOutput(sandboxId)
 *   return { output }
 */
export async function* waitForPtyPattern(
  sandboxId: string,
  options: PtyPatternMatchOptions,
): AsyncGenerator<
  { delta: string; fullOutput: string },
  string, // return — the final full output
  unknown
> {
  const session = getActiveSession(sandboxId)
  const { pattern, timeout = 120_000, interval = 100 } = options
  const startTime = Date.now()

  // Track last-seen output length for delta computation
  let lastLen = session.buffer.join("").length

  while (true) {
    const elapsed = Date.now() - startTime
    if (elapsed >= timeout) {
      const output = session.buffer.join("")
      throw new PtyTimeoutError(
        `Pattern "${pattern}" not found within ${timeout}ms`,
        pattern,
        timeout,
        output,
      )
    }

    const current = session.buffer.join("")

    // Only yield if there's new data
    if (current.length > lastLen) {
      const delta = current.slice(lastLen)
      lastLen = current.length
      yield { delta, fullOutput: current }
    }

    // Strip ANSI escape codes before pattern matching so agent
    // can match prompts like "$" or "❯" despite color codes.
    // Raw output (with ANSI) is kept in the buffer for SSE streaming.
    const strippedCurrent = stripVTControlCharacters(current)
    if (strippedCurrent.includes(pattern)) {
      return current
    }

    await sleep(interval)
  }
}

/**
 * Wait for a specific PTY process to exit.
 * Returns the exit code.
 */
export async function waitForPtyExit(
  sandboxId: string,
  timeout?: number,
): Promise<number> {
  const session = getActiveSession(sandboxId)
  const result = await withTimeout(
    () => session.handle.wait(),
    timeout ?? 60_000,
    "pty.wait",
  )
  return result.exitCode ?? -1
}

// ── Helpers ───────────────────────────────────────────────

function getActiveSession(sandboxId: string): PtySessionState {
  const session = sessions.get(sandboxId)
  if (!session) {
    throw new Error(
      `No PTY session for sandbox "${sandboxId}". Create one with createPtySession().`,
    )
  }
  if (session.destroyed) {
    throw new Error(
      `PTY session for sandbox "${sandboxId}" has been destroyed.`,
    )
  }
  return session
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function withTimeout<T>(
  fn: () => Promise<T>,
  ms: number,
  label?: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(new Error(`${label ?? "Operation"} timed out after ${ms}ms`)),
          ms,
        )
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
