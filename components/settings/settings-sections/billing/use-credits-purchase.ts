"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import { useCreditsStore } from "@/stores/credits-store"
import type { PayFastFormData } from "./payfast-form"

export function useCreditsPurchase() {
  const setPurchasing = useCreditsStore((s) => s.setPurchasing)
  const [payfastFormData, setPayfastFormData] =
    useState<PayFastFormData | null>(null)

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
        setPayfastFormData({
          action: data.formAction,
          fields: data.formFields,
        })
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to start checkout",
        )
        setPurchasing(null)
      }
    },
    [setPurchasing],
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
    [setPurchasing],
  )

  return {
    payfastFormData,
    setPayfastFormData,
    handlePayFastPurchase,
    handlePolarPurchase,
  }
}
