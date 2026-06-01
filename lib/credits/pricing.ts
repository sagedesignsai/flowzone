/**
 * Pricing Plans — Credit packages sold via PayFast (ZAR) and Polar.sh (USD).
 *
 * Each plan offers a fixed number of credits at a fixed price.
 * Prices are stored in cents to avoid floating-point issues.
 */

import { prisma } from "@/lib/prisma"

export interface Plan {
  id: string
  name: string
  credits: number
  /** Price in ZAR cents (for PayFast — South African market) */
  priceZar: number
  /** Price in USD cents (for Polar.sh — international market) */
  priceUsd: number
  description: string | null
  badge: string | null
  active: boolean
  sortOrder: number
}

// ── Default Plans ────────────────────────────────────────────
// Seeded when no plans exist in the database.

const DEFAULT_PLANS: Array<Omit<Plan, "id">> = [
  {
    name: "Starter",
    credits: 100,
    priceZar: 9900,   // R99.00
    priceUsd: 500,    // $5.00
    description: "Perfect for trying out Flowzone — a few quick tasks or code reviews.",
    badge: null,
    active: true,
    sortOrder: 0,
  },
  {
    name: "Pro",
    credits: 500,
    priceZar: 39900,  // R399.00
    priceUsd: 2000,   // $20.00
    description: "For regular development — daily agent tasks and builds.",
    badge: "Popular",
    active: true,
    sortOrder: 1,
  },
  {
    name: "Premium",
    credits: 2000,
    priceZar: 129900, // R1,299.00
    priceUsd: 6000,   // $60.00
    description: "Heavy usage — continuous agent work, sandbox testing, and complex builds.",
    badge: "Best value",
    active: true,
    sortOrder: 2,
  },
  {
    name: "Enterprise",
    credits: 10000,
    priceZar: 499900, // R4,999.00
    priceUsd: 20000,  // $200.00
    description: "For teams and power users — maximum throughput and priority support.",
    badge: null,
    active: true,
    sortOrder: 3,
  },
]

// ── Accessors ─────────────────────────────────────────────────

/**
 * Get all active pricing plans, seeded from defaults if the DB is empty.
 */
export async function getPlans(): Promise<Plan[]> {
  const existing = await prisma.pricingPlan.findMany({
    orderBy: { sortOrder: "asc" },
  })

  if (existing.length > 0) {
    return existing
  }

  // Seed default plans
  await prisma.pricingPlan.createMany({
    data: DEFAULT_PLANS,
  })

  return prisma.pricingPlan.findMany({
    orderBy: { sortOrder: "asc" },
  }) as Promise<Plan[]>
}

/**
 * Get a single plan by ID.
 */
export async function getPlanById(id: string): Promise<Plan | null> {
  const plan = await prisma.pricingPlan.findUnique({ where: { id } })
  return plan as Plan | null
}
