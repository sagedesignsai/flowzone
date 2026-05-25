/**
 * Sandbox Context Store
 *
 * Provides per-request sandbox context via AsyncLocalStorage.
 * Tools read the current sandbox from this store instead of
 * requiring it as an explicit parameter.
 *
 * Usage in API route:
 *   import { Sandbox } from "e2b"
 *   import { SandboxContext } from "@/lib/tools/sandbox-store"
 *
 *   const sandbox = await Sandbox.create()
 *   return SandboxContext.run({ sandbox }, () =>
 *     createAgentUIStreamResponse({ agent, uiMessages }),
 *   )
 *
 * Usage in tool execute:
 *   import { SandboxContext } from "@/lib/tools/sandbox-store"
 *   const { sandbox } = SandboxContext.get()!
 */

import { AsyncLocalStorage } from "async_hooks"
import type { Sandbox } from "e2b"

// ── Types ─────────────────────────────────────────────────

export interface SandboxContextValue {
  sandbox: Sandbox
  /** Path to the cloned repo inside the sandbox, if any */
  repoPath?: string
  /** Current git branch, if any */
  branch?: string
  /** GitHub installation token for push operations, if any */
  token?: string
  /** Chat ID, used to resolve repo context from DB for GitHub tools */
  chatId?: string
}

// ── Store ─────────────────────────────────────────────────

const storage = new AsyncLocalStorage<SandboxContextValue>()

export const SandboxContext = {
  /**
   * Run a function within a sandbox context.
   * All tool execute calls inside this scope can read the context.
   */
  run: <T>(context: SandboxContextValue, fn: () => T): T =>
    storage.run(context, fn),

  /**
   * Get the current sandbox context.
   * Returns undefined if called outside a SandboxContext.run() scope.
   */
  get: (): SandboxContextValue | undefined => {
    return storage.getStore()
  },
}
