/**
 * Desktop Sandbox Context Store
 *
 * Provides per-request desktop sandbox context via AsyncLocalStorage.
 * Tools read the current desktop sandbox from this store instead of
 * requiring it as an explicit parameter.
 *
 * Usage in API route:
 *   import { Sandbox } from "@e2b/desktop"
 *   import { DesktopSandboxContext } from "@/lib/tools/desktop/sandbox-context"
 *
 *   const desktop = await Sandbox.create()
 *   return DesktopSandboxContext.run({ desktop, sandboxId: desktop.sandboxId }, () =>
 *     createAgentUIStreamResponse({ agent, uiMessages }),
 *   )
 *
 * Usage in tool execute:
 *   import { DesktopSandboxContext, requireDesktop } from "@/lib/tools/desktop/sandbox-context"
 *   const ctx = DesktopSandboxContext.get()
 *   if (!ctx) requireDesktop("toolName")
 *   const { desktop } = ctx
 */

import { AsyncLocalStorage } from "async_hooks"
import type { Sandbox } from "@e2b/desktop"

// ── Types ─────────────────────────────────────────────────

export interface DesktopSandboxContextValue {
  desktop: Sandbox
  sandboxId: string
  /** Chat ID, used to resolve repo context from DB for git/GitHub tools */
  chatId?: string
}

// ── Store ─────────────────────────────────────────────────

const storage = new AsyncLocalStorage<DesktopSandboxContextValue>()

export const DesktopSandboxContext = {
  /**
   * Run a function within a desktop sandbox context.
   * All tool execute calls inside this scope can read the context.
   */
  run: <T>(context: DesktopSandboxContextValue, fn: () => T): T =>
    storage.run(context, fn),

  /**
   * Get the current desktop sandbox context.
   * Returns undefined if called outside a DesktopSandboxContext.run() scope.
   */
  get: (): DesktopSandboxContextValue | undefined => {
    return storage.getStore()
  },
}

// ── Guards ────────────────────────────────────────────────

/**
 * Throws a descriptive error when a tool is called without an active
 * desktop sandbox context. Always returns `never` so callers can use
 * it as a type-safe early exit without an extra `return` statement.
 */
export function requireDesktop(label: string): never {
  throw new Error(
    `Cannot run "${label}" — no desktop sandbox is available. Set E2B_API_KEY and create a desktop session first.`,
  )
}
