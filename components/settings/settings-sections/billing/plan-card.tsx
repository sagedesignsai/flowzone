"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  CreditCard,
  Globe,
  Lightning,
  Spinner,
} from "@phosphor-icons/react"
import type { Plan, Providers } from "@/stores/credits-store"
import { formatZar, formatUsd } from "./helpers"

interface PlanCardProps {
  plan: Plan
  providers: Providers
  isBusy: boolean
  onPayFast: (planId: string) => void
  onPolar: (planId: string) => void
}

export function PlanCard({
  plan,
  providers,
  isBusy,
  onPayFast,
  onPolar,
}: PlanCardProps) {
  return (
    <div
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
              onClick={() => onPayFast(plan.id)}
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
              onClick={() => onPolar(plan.id)}
              size="sm"
              variant={
                !providers.payfast && plan.badge ? "default" : "ghost"
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
}
