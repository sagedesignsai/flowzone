/**
 * POST /api/github/webhooks
 *
 * Receive GitHub App webhook events.
 * Verifies the payload signature using @octokit/webhooks and routes
 * events to registered handlers (push, pull_request, installation, etc.)
 *
 * Request:
 *   POST with GitHub webhook payload (JSON)
 *   Headers: x-hub-signature-256, x-github-event, x-github-delivery
 *
 * Response:
 *   200 { received: true } — event accepted and queued
 *   401 { error } — invalid signature
 */

import { type NextRequest, NextResponse } from "next/server"
import { Webhooks } from "@octokit/webhooks"

// Lazy-initialized webhooks instance
let webhooks: Webhooks | null = null

function getWebhooks(): Webhooks {
  if (!webhooks) {
    const secret = process.env.GITHUB_WEBHOOK_SECRET
    if (!secret) {
      throw new Error("Missing GITHUB_WEBHOOK_SECRET environment variable")
    }
    webhooks = new Webhooks({ secret })

    // Register event handlers
    setupHandlers(webhooks)
  }
  return webhooks
}

function setupHandlers(wh: Webhooks) {
  // Dynamic imports to avoid circular deps at module level
  wh.on("push", async (event) => {
    const { handlePush } = await import("@/lib/github/webhooks/push")
    await handlePush(event)
  })

  wh.on("pull_request", async (event) => {
    const { handlePullRequest } =
      await import("@/lib/github/webhooks/pull-request")
    await handlePullRequest(event)
  })

  wh.on("installation", async (event) => {
    const { handleInstallation } =
      await import("@/lib/github/webhooks/installation")
    await handleInstallation(event)
  })

  wh.on("installation_repositories", async (event) => {
    const { handleInstallation } =
      await import("@/lib/github/webhooks/installation")
    // Re-use installation handler for repo-level events
    console.info(`[webhook] installation_repositories: ${event.payload.action}`)
  })

  wh.onError((error) => {
    console.error("[webhook] Processing error:", error)
  })
}

export async function POST(request: NextRequest) {
  try {
    const wh = getWebhooks()

    // Read raw body as text for signature verification
    const body = await request.text()
    const signature = request.headers.get("x-hub-signature-256") ?? ""
    const eventType = request.headers.get("x-github-event") ?? ""
    const deliveryId = request.headers.get("x-github-delivery") ?? ""

    if (!signature || !eventType || !deliveryId) {
      return NextResponse.json(
        {
          error:
            "Missing required headers: x-hub-signature-256, x-github-event, x-github-delivery",
        },
        { status: 400 }
      )
    }

    // Verify and process the event
    await wh.verifyAndReceive({
      id: deliveryId,
      name: eventType as any,
      payload: body,
      signature,
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook verification failed"
    console.error("POST /api/github/webhooks error:", message)

    // Signature mismatch = 401
    if (message.includes("signature") || message.includes("No matching")) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
