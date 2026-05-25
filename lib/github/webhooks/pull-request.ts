/**
 * GitHub Webhook — Pull Request Event Handler
 *
 * Triggered on pull_request events (opened, closed, synchronize, etc.).
 * Logs the event and could trigger actions like re-deployment.
 */

import type { EmitterWebhookEvent } from "@octokit/webhooks"
import { prisma } from "@/lib/prisma"

export async function handlePullRequest(
  event: EmitterWebhookEvent<"pull_request">,
) {
  const { payload } = event
  const action = payload.action
  const fullName = payload.repository?.full_name
  const prNumber = payload.pull_request?.number
  const prTitle = payload.pull_request?.title
  const prState = payload.pull_request?.state

  console.info(
    `[webhook:pull_request] ${fullName}#${prNumber} ${action} — "${prTitle}" (${prState})`,
  )

  // Log the event to the database
  try {
    await prisma.webhookEvent.create({
      data: {
        eventType: "pull_request",
        action,
        payload: payload as unknown as Record<string, unknown>,
        gitRepoId: undefined, // Could be resolved from fullName if needed
        installationId: String(payload.installation?.id ?? ""),
        processed: true,
        processedAt: new Date(),
      },
    })
  } catch (error) {
    console.error("[webhook:pull_request] Failed to persist event:", error)
  }
}
