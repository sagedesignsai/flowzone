/**
 * POST /api/credits/checkout/polar
 *
 * Initiate a Polar.sh checkout for a pricing plan.
 * Returns a redirect URL to Polar's hosted checkout page.
 *
 * Body:
 *   { planId: string }
 *
 * Response:
 *   { checkoutId: string, url: string }
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getPlanById } from "@/lib/credits/pricing"
import {
  ensurePolarProduct,
  createPolarCheckoutLink,
  isPolarConfigured,
} from "@/lib/credits/polar"
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

    if (!isPolarConfigured()) {
      return NextResponse.json(
        {
          message:
            "Polar.sh is not configured. Set POLAR_ACCESS_TOKEN in your environment.",
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

    // Create a pending transaction
    const pendingTx = await prisma.creditTransaction.create({
      data: {
        userId: session.user.id,
        type: "purchase",
        amount: plan.credits,
        balanceAfter: 0,
        description: `Polar: ${plan.name} — ${plan.credits} credits`,
        provider: "polar",
        status: "pending",
      },
    })

    // Ensure a Polar product exists for this plan
    const product = await ensurePolarProduct(
      plan.name,
      plan.description,
      plan.priceUsd,
    )

    // Get the first fixed price from the product
    const price = product.prices[0]
    if (!price) {
      throw new Error(`No price found for Polar product: ${product.id}`)
    }

    // Create checkout link
    const checkout = await createPolarCheckoutLink({
      productPriceId: price.id,
      metadata: {
        userId: session.user.id,
        planId: plan.id,
        transactionId: pendingTx.id,
      },
    })

    // Store the Polar checkout ID on the transaction for webhook correlation
    await prisma.creditTransaction.update({
      where: { id: pendingTx.id },
      data: { providerTxId: checkout.checkoutId },
    })

    logger.info("Polar checkout created", {
      userId: session.user.id,
      planId,
      checkoutId: checkout.checkoutId,
      transactionId: pendingTx.id,
    })

    return NextResponse.json({
      checkoutId: checkout.checkoutId,
      url: checkout.url,
      transactionId: pendingTx.id,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create checkout"
    return NextResponse.json({ message }, { status: 500 })
  }
}
