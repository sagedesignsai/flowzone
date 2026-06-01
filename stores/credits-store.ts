"use client"

import { create } from "zustand"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Plan {
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

export interface Transaction {
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

export interface Providers {
  payfast: boolean
  polar: boolean
}

// ─── State ─────────────────────────────────────────────────────────────────

export interface CreditsState {
  balance: number | null
  transactions: Transaction[]
  totalTx: number
  plans: Plan[]
  providers: Providers
  loading: boolean
  error: string | null
  purchasing: string | null

  fetchAll: () => Promise<void>
  fetchBalance: () => Promise<void>
  fetchPlans: () => Promise<void>
  setPurchasing: (planId: string | null) => void
  refreshAfterPurchase: () => Promise<void>
}

// ─── Initial State ─────────────────────────────────────────────────────────

const initialState = {
  balance: null,
  transactions: [],
  totalTx: 0,
  plans: [],
  providers: { payfast: false, polar: false } as Providers,
  loading: false,
  error: null,
  purchasing: null,
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const useCreditsStore = create<CreditsState>()((set, get) => ({
  ...initialState,

  fetchBalance: async () => {
    try {
      const res = await fetch("/api/credits/balance")
      if (!res.ok) throw new Error("Failed to load balance")
      const data = await res.json()
      set({
        balance: data.balance,
        transactions: data.transactions,
        totalTx: data.total,
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Something went wrong" })
    }
  },

  fetchPlans: async () => {
    try {
      const res = await fetch("/api/credits/plans")
      if (!res.ok) throw new Error("Failed to load pricing plans")
      const data = await res.json()
      set({
        plans: data.plans,
        providers: data.providers,
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Something went wrong" })
    }
  },

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const [plansRes, balanceRes] = await Promise.all([
        fetch("/api/credits/plans"),
        fetch("/api/credits/balance"),
      ])

      if (!plansRes.ok) throw new Error("Failed to load pricing plans")
      if (!balanceRes.ok) throw new Error("Failed to load balance")

      const plansData = await plansRes.json()
      const balanceData = await balanceRes.json()

      set({
        plans: plansData.plans,
        providers: plansData.providers,
        balance: balanceData.balance,
        transactions: balanceData.transactions,
        totalTx: balanceData.total,
        loading: false,
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Something went wrong",
        loading: false,
      })
    }
  },

  setPurchasing: (planId) => set({ purchasing: planId }),

  refreshAfterPurchase: async () => {
    set({ purchasing: null })
    const { fetchBalance, fetchPlans } = get()
    await Promise.all([fetchBalance(), fetchPlans()])
  },
}))
