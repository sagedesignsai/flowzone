/**
 * POST /api/credits/usage
 *
 * Deduct credits from the authenticated user's account.
 * Used by internal systems (e.g. chat handler) to track credit consumption.
 *
 * Body:
 *   { amount: number, description?: string }
 *
 * Returns 402 if insufficient credits.
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { deductCredits, getBalance } from "@/lib/credits/transactions"

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { amount, description } = (await req.json()) as {
      amount: number
      description?: string
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: "Amount must be a positive number" },
        { status: 400 },
      )
    }

    // Check sufficient balance before attempting
    const balance = await getBalance(session.user.id)
    if (balance < amount) {
      return NextResponse.json(
        {
          message: "Insufficient credits",
          balance,
          required: amount,
        },
        { status: 402 },
      )
    }

    const transaction = await deductCredits({
      userId: session.user.id,
      amount,
      description,
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        balanceAfter: transaction.balanceAfter,
        type: transaction.type,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to deduct credits"
    return NextResponse.json({ message }, { status: 500 })
  }
}
