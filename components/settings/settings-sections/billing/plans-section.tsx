"use client"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Plan, Providers } from "@/stores/credits-store"
import { PlanCard } from "./plan-card"

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

interface PlansSectionProps {
  plans: Plan[]
  providers: Providers
  loading: boolean
  error: string | null
  purchasing: string | null
  onRetry: () => void
  onPayFast: (planId: string) => void
  onPolar: (planId: string) => void
}

export function PlansSection({
  plans,
  providers,
  loading,
  error,
  purchasing,
  onRetry,
  onPayFast,
  onPolar,
}: PlansSectionProps) {
  return (
    <>
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
          <Button onClick={onRetry} size="sm" variant="outline">
            Retry
          </Button>
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-muted-foreground">No plans available.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                providers={providers}
                isBusy={purchasing === plan.id}
                onPayFast={onPayFast}
                onPolar={onPolar}
              />
            ))}
          </div>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Credits are added instantly after payment confirmation.
            {providers.payfast &&
              " PayFast supports EFT, credit cards, and more."}
          </p>
        </>
      )}
    </>
  )
}
