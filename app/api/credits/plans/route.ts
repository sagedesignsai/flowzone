/**
 * GET /api/credits/plans
 *
 * Returns available pricing plans for credit purchases.
 * Plans are returned from the database, seeded from defaults if empty.
 */

import { NextResponse } from "next/server"
import { getPlans } from "@/lib/credits/pricing"
import { isPayFastConfigured } from "@/lib/credits/payfast"
import { isPolarConfigured } from "@/lib/credits/polar"

export async function GET() {
  try {
    const plans = await getPlans()

    return NextResponse.json({
      plans,
      providers: {
        payfast: isPayFastConfigured(),
        polar: isPolarConfigured(),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load plans"
    return NextResponse.json({ message }, { status: 500 })
  }
}
