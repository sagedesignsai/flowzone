"use client"

import { create } from "zustand"

// ─── Types ─────────────────────────────────────────────────────────────────

interface SaveMessage {
  type: "success" | "error"
  text: string
}

interface SettingsState {
  // ─── Profile form ──────────────────────────────────────────────
  name: string
  avatarUrl: string
  saving: boolean
  message: SaveMessage | null

  // ─── Actions ───────────────────────────────────────────────────
  setName: (name: string) => void
  setAvatarUrl: (url: string) => void
  setSaving: (saving: boolean) => void
  setMessage: (message: SaveMessage | null) => void
  hydrate: (name: string, avatarUrl: string) => void
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>()((set) => ({
  // Initial state
  name: "",
  avatarUrl: "",
  saving: false,
  message: null,

  // Actions
  setName: (name) => set({ name }),
  setAvatarUrl: (url) => set({ avatarUrl: url }),
  setSaving: (saving) => set({ saving }),
  setMessage: (message) => set({ message }),

  hydrate: (name, avatarUrl) => set({ name, avatarUrl, message: null }),
}))
