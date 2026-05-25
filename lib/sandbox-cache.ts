import type { OpenCodeManager } from "@/lib/opencode-sandbox/manager"

/**
 * In-memory cache for OpenCodeManager instances, keyed by sandbox ID.
 * This avoids restarting the health check + client creation on every prompt
 * when the same sandbox is reused.
 */
const managerCache = new Map<string, OpenCodeManager>()

/**
 * Per-chat creation promises to deduplicate concurrent sandbox creation.
 * When two requests arrive simultaneously for the same chat, the second
 * will await the first's promise instead of creating a duplicate sandbox.
 */
const sandboxCreatePromises = new Map<string, Promise<unknown>>()

export function getCachedManager(sandboxId: string): OpenCodeManager | undefined {
  return managerCache.get(sandboxId)
}

export function setCachedManager(sandboxId: string, manager: OpenCodeManager): void {
  managerCache.set(sandboxId, manager)
}

export function deleteCachedManager(sandboxId: string): void {
  managerCache.delete(sandboxId)
}

/**
 * Deduplicate concurrent sandbox creation for the same chat.
 * If a creation is already in-flight for `chatId`, returns its promise.
 * Otherwise calls `factory` and stores the promise until it settles.
 */
export async function dedupeSandboxCreate<T>(
  chatId: string,
  factory: () => Promise<T>,
): Promise<T> {
  const existing = sandboxCreatePromises.get(chatId)
  if (existing) return existing as Promise<T>

  const promise = factory().finally(() => {
    sandboxCreatePromises.delete(chatId)
  })

  sandboxCreatePromises.set(chatId, promise)
  return promise
}
