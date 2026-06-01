/**
 * GET /api/credits/balance
 *
 * Returns the current user's credit balance and recent transaction history.
 *
 * Query params:
 *   ?limit=20    — max transactions to return (default 50)
 *   ?offset=0    — pagination offset
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getBalance, getTransactions } from "@/lib/credits/transactions"

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100)
    const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0)

    const [balance, { transactions, total }] = await Promise.all([
      getBalance(session.user.id),
      getTransactions(session.user.id, limit, offset),
    ])

    return NextResponse.json({
      balance,
      transactions,
      total,
      limit,
      offset,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load balance"
    return NextResponse.json({ message }, { status: 500 })
  }
}
