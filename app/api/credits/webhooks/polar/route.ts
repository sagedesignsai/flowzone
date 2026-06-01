/**
 * POST /api/credits/webhooks/polar
 *
 * Polar.sh webhook handler.
 *
 * Polar sends webhook events for checkout lifecycle and order completion.
 * We process `order.created` events to credit users after successful payment.
 *
 * No auth — verified via webhook secret signature.
 */

import { NextResponse } from "next/server"
import {
  verifyPolarWebhook,
  parseOrderWebhook,
} from "@/lib/credits/polar"
import { addCredits } from "@/lib/credits/transactions"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = req.headers.get("webhook-polar-signature")

    const payload = await verifyPolarWebhook(body, signature)
    if (!payload) {
      logger.warn("Polar webhook: invalid signature or payload")
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 401 },
      )
    }

    logger.info("Polar webhook received", {
      type: payload.type,
      id: payload.data?.id,
    })

    // Handle order webhooks — user completed payment
    const orderData = parseOrderWebhook(payload)
    if (orderData) {
      const { orderId, metadata, amount } = orderData

      // Check if we've already processed this order
      const existing = await prisma.creditTransaction.findFirst({
        where: { providerTxId: orderId },
      })

      if (existing) {
        logger.info("Polar order already processed", { orderId })
        return NextResponse.json({ received: true })
      }

      // Find the pending transaction from metadata
      const pendingTxId = metadata.transactionId
      const pendingTx = pendingTxId
        ? await prisma.creditTransaction.findUnique({
            where: { id: pendingTxId },
          })
        : null

      if (!pendingTx) {
        logger.warn("Polar order: no pending transaction found", {
          orderId,
          metadata,
        })

        // Still credit the user if we have userId in metadata
        if (metadata.userId && metadata.planId) {
          const plan = await prisma.pricingPlan.findUnique({
            where: { id: metadata.planId },
          })

          if (plan) {
            await addCredits({
              userId: metadata.userId,
              amount: plan.credits,
              type: "purchase",
              description: `Polar: ${plan.name} — ${plan.credits} credits`,
              provider: "polar",
              providerTxId: orderId,
              status: "completed",
            })

            logger.info("Polar payment completed (fallback)", {
              userId: metadata.userId,
              planId: metadata.planId,
              orderId,
            })
          }
        }

        return NextResponse.json({ received: true })
      }

      // Credit the user
      await addCredits({
        userId: pendingTx.userId,
        amount: pendingTx.amount,
        type: "purchase",
        description: pendingTx.description ?? "Polar credit purchase",
        provider: "polar",
        providerTxId: orderId,
        status: "completed",
      })

      // Mark pending as completed
      await prisma.creditTransaction.update({
        where: { id: pendingTx.id },
        data: {
          status: "completed",
          providerTxId: orderId,
        },
      })

      logger.info("Polar payment completed", {
        userId: pendingTx.userId,
        amount: pendingTx.amount,
        orderId,
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error("Polar webhook error", { error: String(error) })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * GET — Webhook configuration verification (Polar may send a GET to verify the endpoint).
 */
export async function GET() {
  return NextResponse.json({ ok: true })
}
