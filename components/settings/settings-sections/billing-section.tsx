"use client"

import { SettingsSection } from "@/components/settings/settings-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  CheckCircle,
  Clock,
  CreditCard,
  Globe,
  Lightning,
  Spinner,
  Timer,
  XCircle,
} from "@phosphor-icons/react"
import { formatDistanceToNow } from "date-fns"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

// ─── Types ──────────────────────────────────────────────────────────────────

interface Plan {
  id: string
  name: string
  credits: number
  priceZar: number
  priceUsd: number
  description: string | null
  badge: string | null
  active: boolean
  sortOrder: number
}

interface Transaction {
  id: string
  userId: string
  type: string
  amount: number
  balanceAfter: number
  description: string | null
  provider: string | null
  providerTxId: string | null
  status: string | null
  createdAt: string
}

interface Providers {
  payfast: boolean
  polar: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatZar(cents: number): string {
  return `R ${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function PlanCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-5">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-3 w-48" />
      <Skeleton className="mt-2 h-9 w-full" />
    </div>
  )
}

function BalanceSkeleton() {
  return (
    <div className="flex items-baseline gap-2">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-4 w-20" />
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function BillingSection() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [providers, setProviders] = useState<Providers>({
    payfast: false,
    polar: false,
  })
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalTx, setTotalTx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const payfastFormRef = useRef<HTMLFormElement>(null)
  const [payfastFormData, setPayfastFormData] = useState<{
    action: string
    fields: Record<string, string>
  } | null>(null)

  // ── Fetch data ───────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [plansRes, balanceRes] = await Promise.all([
        fetch("/api/credits/plans"),
        fetch("/api/credits/balance"),
      ])

      if (!plansRes.ok) {
        throw new Error("Failed to load pricing plans")
      }
      if (!balanceRes.ok) {
        throw new Error("Failed to load balance")
      }

      const plansData = await plansRes.json()
      const balanceData = await balanceRes.json()

      setPlans(plansData.plans)
      setProviders(plansData.providers)
      setBalance(balanceData.balance)
      setTransactions(balanceData.transactions)
      setTotalTx(balanceData.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Submit PayFast form ──────────────────────────────────────

  useEffect(() => {
    if (payfastFormData && payfastFormRef.current) {
      payfastFormRef.current.submit()
      setPayfastFormData(null)
    }
  }, [payfastFormData])

  // ── Purchase handlers ────────────────────────────────────────

  const handlePayFastPurchase = useCallback(
    async (planId: string) => {
      setPurchasing(planId)
      try {
        const res = await fetch("/api/credits/checkout/payfast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.message ?? "Checkout failed")
        }

        const data = await res.json()
        setPayfastFormData({ action: data.formAction, fields: data.formFields })
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to start checkout",
        )
        setPurchasing(null)
      }
    },
    [],
  )

  const handlePolarPurchase = useCallback(
    async (planId: string) => {
      setPurchasing(planId)
      try {
        const res = await fetch("/api/credits/checkout/polar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.message ?? "Checkout failed")
        }

        const data = await res.json()

        // Redirect to Polar hosted checkout
        if (data.url) {
          window.location.href = data.url
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to start checkout",
        )
        setPurchasing(null)
      }
    },
    [],
  )

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Hidden form for PayFast redirect */}
      {payfastFormData && (
        <form
          ref={payfastFormRef}
          action={payfastFormData.action}
          method="POST"
          className="hidden"
        >
          {Object.entries(payfastFormData.fields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}

      {/* ── Balance ── */}
      <SettingsSection title="Credit Balance" description="Your available credits for AI agent usage.">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {balance === null ? (
              <BalanceSkeleton />
            ) : (
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold tabular-nums tracking-tight">
                  {balance.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">credits</span>
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Credits are consumed by AI agent interactions.{" "}
              {balance !== null && balance < 100
                ? "You're running low — top up below."
                : ""}
            </p>
          </div>

          {balance !== null && balance > 0 && (
            <Badge
              className={cn(
                "self-start px-3 py-1 text-xs",
                balance > 500
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : balance > 100
                    ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                    : "border-amber-500/20 bg-amber-500/10 text-amber-400",
              )}
              variant="outline"
            >
              {balance > 500
                ? "Healthy"
                : balance > 100
                  ? "Adequate"
                  : "Low"}
            </Badge>
          )}
        </div>
      </SettingsSection>

      {/* ── Plans ── */}
      <SettingsSection
        title="Purchase Credits"
        description="Choose a plan that fits your needs. Credits never expire."
      >
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PlanCardSkeleton />
            <PlanCardSkeleton />
            <PlanCardSkeleton />
            <PlanCardSkeleton />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={fetchData} size="sm" variant="outline">
              Retry
            </Button>
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-sm text-muted-foreground">No plans available.</p>
          </div>
        ) : (
          <>
            {/* Plan cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => {
                const isBusy = purchasing === plan.id

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col rounded-xl border p-5 transition-all",
                      plan.badge
                        ? "border-blue-500/30 shadow-sm ring-1 ring-blue-500/10"
                        : "border-border",
                    )}
                  >
                    {plan.badge && (
                      <Badge className="absolute -top-2.5 right-3 bg-blue-500 px-2 text-[10px] text-white">
                        {plan.badge}
                      </Badge>
                    )}

                    <div className="mb-1 flex items-center gap-2">
                      <Lightning
                        className={cn(
                          "size-4",
                          plan.badge ? "text-blue-500" : "text-muted-foreground",
                        )}
                      />
                      <h3 className="text-sm font-semibold">{plan.name}</h3>
                    </div>

                    <p className="mb-3 text-3xl font-bold tracking-tight">
                      {plan.credits.toLocaleString()}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        credits
                      </span>
                    </p>

                    {plan.description && (
                      <p className="mb-4 min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground">
                        {plan.description}
                      </p>
                    )}

                    <div className="mt-auto flex flex-col gap-2">
                      {/* Price labels */}
                      <div className="mb-1 space-y-0.5 text-xs text-muted-foreground">
                        {providers.payfast && (
                          <p className="flex items-center gap-1.5">
                            <span className="size-1 rounded-full bg-green-500" />
                            SA (PayFast): {formatZar(plan.priceZar)}
                          </p>
                        )}
                        {providers.polar && (
                          <p className="flex items-center gap-1.5">
                            <Globe className="size-3" />
                            International (Polar): {formatUsd(plan.priceUsd)}
                          </p>
                        )}
                        {!providers.payfast && !providers.polar && (
                          <p className="italic">No payment provider configured</p>
                        )}
                      </div>

                      {/* Buy buttons */}
                      <div className="flex flex-col gap-1.5">
                        {providers.payfast && (
                          <Button
                            disabled={isBusy}
                            onClick={() => handlePayFastPurchase(plan.id)}
                            size="sm"
                            variant={plan.badge ? "default" : "outline"}
                          >
                            {isBusy ? (
                              <>
                                <Spinner className="size-3.5 animate-spin" />
                                Processing…
                              </>
                            ) : (
                              <>
                                <CreditCard className="size-3.5" />
                                Pay with PayFast
                              </>
                            )}
                          </Button>
                        )}

                        {providers.polar && (
                          <Button
                            disabled={isBusy}
                            onClick={() => handlePolarPurchase(plan.id)}
                            size="sm"
                            variant={
                              !providers.payfast && plan.badge
                                ? "default"
                                : "ghost"
                            }
                          >
                            {isBusy ? (
                              <>
                                <Spinner className="size-3.5 animate-spin" />
                                Redirecting…
                              </>
                            ) : (
                              <>
                                <Globe className="size-3.5" />
                                Pay with Polar
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              Credits are added instantly after payment confirmation.
              {providers.payfast && " PayFast supports EFT, credit cards, and more."}
            </p>
          </>
        )}
      </SettingsSection>

      {/* ── Transaction History ── */}
      <SettingsSection title="Transaction History" description="Your recent credit activity.">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : error ? (
          <p className="py-4 text-center text-sm text-destructive">{error}</p>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <CreditCard className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
            <p className="text-xs text-muted-foreground/70">
              Purchase credits above to get started.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium",
                        tx.type === "purchase" && "text-emerald-400",
                        tx.type === "usage" && "text-amber-400",
                        tx.type === "refund" && "text-blue-400",
                        tx.type === "bonus" && "text-purple-400",
                      )}
                    >
                      {tx.type === "purchase" && <ArrowRight className="size-3" />}
                      {tx.type === "usage" && <Lightning className="size-3" />}
                      {tx.type === "refund" && <CheckCircle className="size-3" />}
                      {tx.type === "bonus" && <Lightning className="size-3" />}
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "tabular-nums text-sm font-medium",
                        tx.amount > 0
                          ? "text-emerald-400"
                          : "text-amber-400",
                      )}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums text-sm text-muted-foreground">
                    {tx.balanceAfter.toLocaleString()}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {tx.description ?? "—"}
                  </TableCell>
                  <TableCell>
                    {tx.status === "completed" && (
                      <Badge
                        className="border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-400"
                        variant="outline"
                      >
                        <CheckCircle className="mr-0.5 size-2.5" />
                        Done
                      </Badge>
                    )}
                    {tx.status === "pending" && (
                      <Badge
                        className="border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-400"
                        variant="outline"
                      >
                        <Timer className="mr-0.5 size-2.5" />
                        Pending
                      </Badge>
                    )}
                    {tx.status === "failed" && (
                      <Badge
                        className="border-red-500/20 bg-red-500/10 text-[10px] text-red-400"
                        variant="outline"
                      >
                        <XCircle className="mr-0.5 size-2.5" />
                        Failed
                      </Badge>
                    )}
                    {!tx.status && (
                      <span className="text-[10px] text-muted-foreground">
                        —
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatDate(tx.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {totalTx > 50 && (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Showing 50 of {totalTx} transactions.
          </p>
        )}
      </SettingsSection>
    </div>
  )
}
