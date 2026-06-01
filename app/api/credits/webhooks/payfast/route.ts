/**
 * POST /api/credits/webhooks/payfast
 *
 * PayFast ITN (Instant Transaction Notification) webhook.
 *
 * PayFast sends this server-to-server after a payment is processed.
 * We must:
 *   1. Verify the ITN (signature, amount, merchant_id, status)
 *   2. Re-post data to PayFast for server-side validation
 *   3. Credit the user's account
 *
 * This endpoint is called by PayFast's servers — no auth check.
 * The response must be plain text (not JSON) per PayFast specs.
 */

import { prisma } from "@/lib/prisma"
import { addCredits } from "@/lib/credits/transactions"
import { verifyITN } from "@/lib/credits/payfast"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const text = await req.text()
    const params = new URLSearchParams(text)
    const data: Record<string, string> = {}
    for (const [key, value] of params) {
      data[key] = value
    }

    logger.info("PayFast ITN received", {
      pf_payment_id: data.pf_payment_id,
      payment_status: data.payment_status,
      m_payment_id: data.m_payment_id,
    })

    // Look up the pending transaction to get expected amount
    const pendingTx = data.m_payment_id
      ? await prisma.creditTransaction.findUnique({
          where: { id: data.m_payment_id },
          select: { amount: true, status: true, userId: true },
        })
      : null

    if (!pendingTx) {
      logger.warn("PayFast ITN: unknown m_payment_id", {
        m_payment_id: data.m_payment_id,
      })
      return new Response("UNKNOWN TRANSACTION", { status: 200 })
    }

    if (pendingTx.status === "completed") {
      logger.warn("PayFast ITN: transaction already completed", {
        m_payment_id: data.m_payment_id,
      })
      return new Response("OK", { status: 200 })
    }

    const plan = await prisma.pricingPlan.findFirst({
      where: { credits: pendingTx.amount },
      select: { priceZar: true },
    })

    const expectedAmount = plan?.priceZar

    // Get the request IP for PayFast IP validation
    const remoteIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      ""

    // Verify the ITN
    const result = await verifyITN(data, {
      expectedAmount,
      remoteIp: remoteIp || undefined,
    })

    if (!result.valid) {
      logger.warn("PayFast ITN verification failed", {
        reason: result.reason,
        pf_payment_id: data.pf_payment_id,
      })

      // Mark transaction as failed
      await prisma.creditTransaction.update({
        where: { id: data.m_payment_id },
        data: {
          status: "failed",
          providerTxId: data.pf_payment_id,
        },
      })

      return new Response("INVALID", { status: 200 })
    }

    // Credit the user
    await addCredits({
      userId: pendingTx.userId,
      amount: pendingTx.amount,
      type: "purchase",
      description: `PayFast: ${data.item_name ?? "Credit purchase"}`,
      provider: "payfast",
      providerTxId: data.pf_payment_id,
      status: "completed",
    })

    // Mark pending transaction as completed
    await prisma.creditTransaction.update({
      where: { id: data.m_payment_id },
      data: {
        status: "completed",
        providerTxId: data.pf_payment_id,
      },
    })

    logger.info("PayFast payment completed", {
      userId: pendingTx.userId,
      amount: pendingTx.amount,
      pf_payment_id: data.pf_payment_id,
    })

    return new Response("OK", { status: 200 })
  } catch (error) {
    logger.error("PayFast ITN error", { error: String(error) })
    // Always return 200 to PayFast (they retry on non-200)
    return new Response("ERROR", { status: 200 })
  }
}
