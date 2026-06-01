"use client"

import { useEffect } from "react"
import { SettingsSection } from "@/components/settings/settings-section"
import { useCreditsStore } from "@/stores/credits-store"
import { BalanceDisplay } from "./balance-display"
import { PayFastForm } from "./payfast-form"
import { PlansSection } from "./plans-section"
import { TransactionHistory } from "./transaction-history"
import { useCreditsPurchase } from "./use-credits-purchase"

export function BillingSection() {
  // ── Store ────────────────────────────────────────────────────
  const plans = useCreditsStore((s) => s.plans)
  const providers = useCreditsStore((s) => s.providers)
  const balance = useCreditsStore((s) => s.balance)
  const transactions = useCreditsStore((s) => s.transactions)
  const totalTx = useCreditsStore((s) => s.totalTx)
  const loading = useCreditsStore((s) => s.loading)
  const error = useCreditsStore((s) => s.error)
  const purchasing = useCreditsStore((s) => s.purchasing)
  const fetchAll = useCreditsStore((s) => s.fetchAll)

  // ── Purchase hook ────────────────────────────────────────────
  const {
    payfastFormData,
    setPayfastFormData,
    handlePayFastPurchase,
    handlePolarPurchase,
  } = useCreditsPurchase()

  // ── Fetch data on mount ──────────────────────────────────────
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <PayFastForm
        formData={payfastFormData}
        onSubmitted={() => setPayfastFormData(null)}
      />

      {/* ── Balance ── */}
      <SettingsSection
        title="Credit Balance"
        description="Your available credits for AI agent usage."
      >
        <BalanceDisplay balance={balance} />
      </SettingsSection>

      {/* ── Plans ── */}
      <SettingsSection
        title="Purchase Credits"
        description="Choose a plan that fits your needs. Credits never expire."
      >
        <PlansSection
          plans={plans}
          providers={providers}
          loading={loading}
          error={error}
          purchasing={purchasing}
          onRetry={fetchAll}
          onPayFast={handlePayFastPurchase}
          onPolar={handlePolarPurchase}
        />
      </SettingsSection>

      {/* ── Transaction History ── */}
      <SettingsSection
        title="Transaction History"
        description="Your recent credit activity."
      >
        <TransactionHistory
          transactions={transactions}
          totalTx={totalTx}
          loading={loading}
          error={error}
        />
      </SettingsSection>
    </div>
  )
}
