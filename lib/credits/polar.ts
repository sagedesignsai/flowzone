/**
 * Polar.sh Integration (International payments)
 *
 * Polar.sh is a payment platform for digital products that handles Stripe,
 * and supports subscriptions and one-time purchases via hosted checkout pages.
 *
 * Flow:
 *   1. Server requests a checkout link from Polar's API
 *   2. Client redirects user to the Polar hosted checkout
 *   3. Polar sends webhook events (checkout.created, order.created, order.paid, etc.)
 *   4. On `order.paid` (or `order.created` if `paid` is `true`), we credit the user
 *      NOTE: `order.created` fires before payment is confirmed (status may be
 *      "pending") — always check the `paid` field or use `order.paid` instead.
 *
 * Environment:
 *   POLAR_ACCESS_TOKEN   — Polar.sh API token (required)
 *   POLAL_ORGANIZATION   — Polar.sh organization slug (optional, for checkout links)
 *   POLAR_WEBHOOK_SECRET — Secret for verifying webhook signatures
 *   POLAR_SUCCESS_URL    — URL to redirect after successful checkout
 *
 * API docs: https://docs.polar.sh/api/
 */

import { logger } from "@/lib/logger"

// ── Types ─────────────────────────────────────────────────────

interface PolarConfig {
  accessToken: string
  baseUrl: string
  organizationId?: string
  successUrl: string
}

interface PolarProduct {
  id: string
  name: string
  description: string | null
  prices: Array<{
    id: string
    amount_type: "fixed"
    price_amount: number
    price_currency: string
  }>
}

interface PolarCheckout {
  id: string
  url: string
  product_id: string
  product_price_id: string
  status: string
  customer_id: string | null
}

// ── Config ────────────────────────────────────────────────────

function config(): PolarConfig {
  const accessToken = process.env.POLAR_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error(
      "Polar.sh not configured. Set POLAR_ACCESS_TOKEN in your environment.",
    )
  }

  return {
    accessToken,
    baseUrl: "https://api.polar.sh",
    successUrl:
      process.env.POLAR_SUCCESS_URL ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/settings/billing?checkout_success=true`,
  }
}

// ── API Client ────────────────────────────────────────────────

const POLAR_API_VERSION = "2024-06-01"

async function polarFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const cfg = config()
  const response = await fetch(`${cfg.baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${cfg.accessToken}`,
      "Content-Type": "application/json",
      Accept: `application/json; version=${POLAR_API_VERSION}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Polar API error (${response.status}): ${text}`)
  }

  return response.json() as Promise<T>
}

// ── Product / Checkout ────────────────────────────────────────

/**
 * Create or find a Polar product for a given pricing plan.
 * Products are looked up by name; if none exists, a new one is created.
 */
export async function ensurePolarProduct(
  name: string,
  description: string | null,
  priceUsd: number, // in cents
): Promise<PolarProduct> {
  // Try to find an existing product with this name
  const existing = await polarFetch<{ items: PolarProduct[] }>(
    `/v1/products?name=${encodeURIComponent(name)}&limit=1`,
  )

  if (existing.items.length > 0) {
    return existing.items[0]!
  }

  // Create a new product
  const product = await polarFetch<PolarProduct>("/v1/products", {
    method: "POST",
    body: JSON.stringify({
      name,
      description: description ?? "",
      prices: [
        {
          amount_type: "fixed",
          price_amount: priceUsd,
          price_currency: "usd",
        },
      ],
    }),
  })

  logger.info("Polar product created", {
    productId: product.id,
    name,
    priceUsd,
  })

  return product
}

/**
 * Create a Polar checkout link for a given product price.
 * Returns the URL to redirect the user to.
 */
export async function createPolarCheckoutLink({
  productPriceId,
  customerId,
  metadata,
}: {
  productPriceId: string
  /** Polar customer ID if known */
  customerId?: string
  /** Arbitrary metadata attached to the checkout (e.g. userId, planId) */
  metadata?: Record<string, string>
}): Promise<{ checkoutId: string; url: string }> {
  const cfg = config()

  const checkout = await polarFetch<PolarCheckout>("/v1/checkouts", {
    method: "POST",
    body: JSON.stringify({
      product_price_id: productPriceId,
      success_url: cfg.successUrl,
      customer_id: customerId ?? null,
      metadata: metadata ?? {},
      ...(customerId ? {} : { customer_external_id: metadata?.userId }),
    }),
  })

  logger.info("Polar checkout created", {
    checkoutId: checkout.id,
    url: checkout.url,
  })

  return { checkoutId: checkout.id, url: checkout.url }
}

// ── Webhook Verification ─────────────────────────────────────

export interface PolarWebhookPayload {
  type: string
  data: {
    id: string
    [key: string]: unknown
  }
}

/**
 * Verify a Polar webhook signature and parse the payload.
 *
 * Polar sends a `webhook-polar-signature` header.
 * If POLAR_WEBHOOK_SECRET is set, we verify the signature;
 * otherwise we trust the payload (dev mode).
 */
export async function verifyPolarWebhook(
  body: string,
  signatureHeader: string | null,
): Promise<PolarWebhookPayload | null> {
  const secret = process.env.POLAR_WEBHOOK_SECRET

  // If a webhook secret is configured, verify the signature
  if (secret && signatureHeader) {
    const { createHmac, timingSafeEqual } = await import("node:crypto")

    const expectedSig = createHmac("sha256", secret)
      .update(body)
      .digest("hex")

    // Polar sends the signature as `sha256=...`
    const actualSig = signatureHeader.replace(/^sha256=/, "")

    if (
      !timingSafeEqual(
        Buffer.from(expectedSig),
        Buffer.from(actualSig),
      )
    ) {
      logger.warn("Polar webhook signature verification failed")
      return null
    }
  }

  try {
    return JSON.parse(body) as PolarWebhookPayload
  } catch {
    return null
  }
}

/**
 * Handle Polar order webhook events (order.created, order.paid, order.updated).
 *
 * - `order.created` fires when an order is created, but the order status may
 *   be `pending` at that point. Only process if `paid` is explicitly `true`.
 * - `order.paid` fires when payment is fully confirmed (recommended event
 *   for crediting users per Polar's docs).
 *
 * Returns the order's id, metadata, and amount in USD cents, or null if
 * the event should not be processed (e.g. payment still pending).
 */
export function parseOrderWebhook(
  payload: PolarWebhookPayload,
): {
  orderId: string
  metadata: Record<string, string>
  amount: number // in cents (USD)
} | null {
  const acceptedTypes = ["order.created", "order.paid"]
  if (!acceptedTypes.includes(payload.type)) return null

  const order = payload.data as {
    id: string
    metadata?: Record<string, string>
    amount?: number
    paid?: boolean
    status?: string
  }

  // For order.created, only process if payment is already confirmed
  if (payload.type === "order.created") {
    if (order.paid !== true && order.status !== "paid") {
      return null
    }
  }

  return {
    orderId: order.id,
    metadata: order.metadata ?? {},
    amount: order.amount ?? 0,
  }
}

/**
 * Check if Polar.sh is configured (has access token).
 */
export function isPolarConfigured(): boolean {
  return Boolean(process.env.POLAR_ACCESS_TOKEN)
}
