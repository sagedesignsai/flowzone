/**
 * POST /api/credits/checkout/payfast
 *
 * Initiate a PayFast checkout for a pricing plan.
 * Returns signed form data that the client should POST to PayFast.
 *
 * Body:
 *   { planId: string }
 *
 * Response:
 *   { formAction: string, formFields: Record<string, string> }
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getPlanById } from "@/lib/credits/pricing"
import { preparePayFastCheckout, isPayFastConfigured } from "@/lib/credits/payfast"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!isPayFastConfigured()) {
      return NextResponse.json(
        {
          message:
            "PayFast is not configured. Set PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY.",
        },
        { status: 503 },
      )
    }

    const { planId } = (await req.json()) as { planId: string }

    if (!planId) {
      return NextResponse.json(
        { message: "Plan ID is required" },
        { status: 400 },
      )
    }

    const plan = await getPlanById(planId)
    if (!plan) {
      return NextResponse.json(
        { message: "Pricing plan not found" },
        { status: 404 },
      )
    }

    // Create a pending transaction with a unique payment reference
    const pendingTx = await prisma.creditTransaction.create({
      data: {
        userId: session.user.id,
        type: "purchase",
        amount: plan.credits,
        balanceAfter: 0, // will be updated on confirmation
        description: `PayFast: ${plan.name} — ${plan.credits} credits`,
        provider: "payfast",
        status: "pending",
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    const checkout = preparePayFastCheckout({
      amount: plan.priceZar / 100, // convert cents to ZAR
      itemName: `${plan.name} — ${plan.credits} credits`,
      itemDescription: plan.description ?? undefined,
      mPaymentId: pendingTx.id, // use transaction ID as reference
      returnUrl: `${baseUrl}/settings/billing?checkout_success=true`,
      cancelUrl: `${baseUrl}/settings/billing?checkout_cancelled=true`,
      notifyUrl: `${baseUrl}/api/credits/webhooks/payfast`,
      email: session.user.email ?? undefined,
      nameFirst: session.user.name ?? undefined,
    })

    logger.info("PayFast checkout initiated", {
      userId: session.user.id,
      planId,
      transactionId: pendingTx.id,
    })

    return NextResponse.json(checkout)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create checkout"
    return NextResponse.json({ message }, { status: 500 })
  }
}
