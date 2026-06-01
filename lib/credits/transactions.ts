/**
 * Credit Transactions — Ledger management for user credits.
 *
 * All credit operations go through this module to ensure
 * the running balance is always correct.
 */

import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export type TransactionType = "purchase" | "usage" | "refund" | "bonus" | "expired"
export type TransactionStatus = "completed" | "pending" | "failed"
export type PaymentProvider = "payfast" | "polar"

export interface Transaction {
  id: string
  userId: string
  type: TransactionType
  amount: number
  balanceAfter: number
  description: string | null
  provider: string | null
  providerTxId: string | null
  status: string | null
  createdAt: Date
}

// ── Balance ───────────────────────────────────────────────────

/**
 * Get a user's current credit balance.
 */
export async function getBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  })
  return user?.credits ?? 0
}

/**
 * Get transaction history for a user, most recent first.
 */
export async function getTransactions(
  userId: string,
  limit = 50,
  offset = 0,
): Promise<{ transactions: Transaction[]; total: number }> {
  const [transactions, total] = await Promise.all([
    prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.creditTransaction.count({ where: { userId } }),
  ])

  return { transactions: transactions as Transaction[], total }
}

// ── Mutations ─────────────────────────────────────────────────

/**
 * Add credits to a user's account.
 * Creates a transaction record and updates the user balance atomically.
 */
export async function addCredits({
  userId,
  amount,
  type,
  description,
  provider,
  providerTxId,
  status = "completed",
}: {
  userId: string
  amount: number
  type: TransactionType
  description?: string
  provider?: PaymentProvider
  providerTxId?: string
  status?: TransactionStatus
}): Promise<Transaction> {
  if (amount <= 0) {
    throw new Error("Credit amount must be positive")
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
      select: { credits: true },
    })

    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        type,
        amount,
        balanceAfter: user.credits,
        description: description ?? null,
        provider: provider ?? null,
        providerTxId: providerTxId ?? null,
        status,
      },
    })

    return transaction
  })

  logger.info("Credits added", {
    userId,
    amount,
    type,
    balanceAfter: result.balanceAfter,
  })

  return result as Transaction
}

/**
 * Deduct credits from a user's account.
 * Throws if the user has insufficient credits.
 */
export async function deductCredits({
  userId,
  amount,
  description,
}: {
  userId: string
  amount: number
  description?: string
}): Promise<Transaction> {
  if (amount <= 0) {
    throw new Error("Deduction amount must be positive")
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    })

    if (!user || user.credits < amount) {
      throw new Error(
        `Insufficient credits: have ${user?.credits ?? 0}, need ${amount}`,
      )
    }

    const updated = await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
      select: { credits: true },
    })

    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        type: "usage",
        amount: -amount,
        balanceAfter: updated.credits,
        description: description ?? null,
        status: "completed",
      },
    })

    return transaction
  })

  logger.info("Credits deducted", {
    userId,
    amount,
    balanceAfter: result.balanceAfter,
  })

  return result as Transaction
}

/**
 * Check if a user has at least the given number of credits.
 */
export async function hasSufficientCredits(
  userId: string,
  amount: number,
): Promise<boolean> {
  const balance = await getBalance(userId)
  return balance >= amount
}
