const desktopCreatePromises = new Map<string, Promise<unknown>>()

/**
 * Deduplicate concurrent desktop sandbox creation for the same chat.
 */
export async function dedupeDesktopCreate<T>(
  chatId: string,
  factory: () => Promise<T>,
): Promise<T> {
  const existing = desktopCreatePromises.get(chatId)
  if (existing) return existing as Promise<T>

  const promise = factory().finally(() => {
    desktopCreatePromises.delete(chatId)
  })

  desktopCreatePromises.set(chatId, promise)
  return promise
}
