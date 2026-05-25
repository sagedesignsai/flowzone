/**
 * GitHub Webhook — Installation Event Handler
 *
 * Triggered when the GitHub App is installed, uninstalled, or suspended.
 * Syncs the local database with the installation state.
 */

import type { EmitterWebhookEvent } from "@octokit/webhooks"
import { prisma } from "@/lib/prisma"

export async function handleInstallation(
  event: EmitterWebhookEvent<"installation">
) {
  const { payload } = event
  const action = payload.action
  const installationId = payload.installation?.id
  const accountLogin = payload.installation?.account?.login ?? "unknown"

  console.info(
    `[webhook:installation] ${action} — ${accountLogin} (installation: ${installationId})`
  )

  if (action === "deleted") {
    // Remove all GitRepo records associated with this installation
    try {
      const result = await prisma.gitRepo.deleteMany({
        where: { installationId: String(installationId) },
      })
      console.info(
        `[webhook:installation] Removed ${result.count} repo(s) for deleted installation ${installationId}`
      )
    } catch (error) {
      console.error("[webhook:installation] Failed to remove repos:", error)
    }
  }
}
