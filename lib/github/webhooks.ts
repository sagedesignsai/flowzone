/**
 * GitHub Integration — Webhook Verification
 *
 * Verifies GitHub webhook payload signatures using HMAC-SHA256.
 * The @octokit/webhooks package is used for full event handling,
 * this module provides the standalone verification function
 * and a simple event router.
 */

import { Webhooks } from "@octokit/webhooks"

// ── Webhook client singleton ───────────────────────────────

let _webhooks: Webhooks | null = null

function getWebhooks(): Webhooks {
  if (!_webhooks) {
    const secret = process.env.GITHUB_WEBHOOK_SECRET
    if (!secret) {
      throw new Error(
        "Missing required env var: GITHUB_WEBHOOK_SECRET. " +
          "Set it to the webhook secret configured in your GitHub App settings.",
      )
    }
    _webhooks = new Webhooks({ secret })
  }
  return _webhooks
}

// ── Verify & Receive ───────────────────────────────────────

/**
 * Verify a webhook payload signature and receive the event.
 *
 * @param payload - Raw JSON string of the webhook payload
 * @param signature - Value of the x-hub-signature-256 header
 * @param eventType - Value of the x-github-event header
 * @param id - Value of the x-github-delivery header
 * @returns true if valid, throws if invalid
 */
export async function verifyAndReceive(
  payload: string,
  signature: string,
  eventType: string,
  id: string,
): Promise<boolean> {
  const webhooks = getWebhooks()

  await webhooks.verifyAndReceive({
    id,
    name: eventType as any,
    payload,
    signature,
  })

  return true
}

/**
 * Register a webhook event handler.
 * Thin wrapper around @octokit/webhooks on().
 */
export function onWebhookEvent(
  eventName: string | string[],
  handler: (event: any) => void | Promise<void>,
): void {
  const webhooks = getWebhooks()
  webhooks.on(eventName as any, handler)
}

/**
 * Register an error handler for webhook processing errors.
 */
export function onWebhookError(
  handler: (error: any) => void | Promise<void>,
): void {
  const webhooks = getWebhooks()
  webhooks.onError(handler)
}
