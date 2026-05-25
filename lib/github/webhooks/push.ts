/**
 * GitHub Webhook — Push Event Handler
 *
 * Triggered when commits are pushed to a branch.
 * Logs the event and updates repo metadata.
 */

import type { EmitterWebhookEvent } from "@octokit/webhooks"
import { prisma } from "@/lib/prisma"

export async function handlePush(event: EmitterWebhookEvent<"push">) {
  const { payload } = event
  const fullName = payload.repository?.full_name

  if (!fullName) {
    console.warn("[webhook:push] No repository full_name in payload")
    return
  }

  const ref = payload.ref // e.g., "refs/heads/main"
  const branch = ref.replace("refs/heads/", "")
  const commits = payload.commits ?? []
  const pusher = payload.pusher?.name ?? "unknown"

  console.info(
    `[webhook:push] ${fullName}:${branch} — ${commits.length} commit(s) by ${pusher}`
  )

  // Log the event to the database
  try {
    await prisma.webhookEvent.create({
      data: {
        eventType: "push",
        action: branch,
        payload: payload as unknown as Record<string, unknown>,
        installationId: String(payload.installation?.id ?? ""),
        processed: true,
        processedAt: new Date(),
      },
    })
  } catch (error) {
    console.error("[webhook:push] Failed to persist event:", error)
  }
}
