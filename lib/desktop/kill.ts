import { logger } from "@/lib/logger"

/**
 * Kill an E2B desktop sandbox by ID. Safe to call if already gone.
 */
export async function killDesktopSandbox(sandboxId: string): Promise<void> {
  if (!process.env.E2B_API_KEY) return

  try {
    const { Sandbox } = await import("@e2b/desktop")
    const desktop = await Sandbox.connect(sandboxId)
    await desktop.kill()
  } catch (error) {
    logger.warn("killDesktopSandbox failed", {
      sandboxId,
      error: String(error),
    })
  }
}
