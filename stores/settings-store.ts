"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface GitHubConfig {
  owner: string
  name: string
  url: string
  connected: boolean
  level?: "user" | "project"
  projectId?: string
}

export interface GitHubInstallation {
  id: number
  accountLogin: string
  accountType: string
  reposCount: number
}

export interface GitHubRepository {
  id: number
  owner: string
  name: string
  fullName: string
  installationId: number
}

export interface IntegrationConfig {
  name: string
  connected: boolean
  config?: Record<string, string>
}

export interface SaveMessage {
  type: "success" | "error"
  text: string
}

export interface SettingsState {
  // ─── GitHub ────────────────────────────────────────────────────────────
  github: GitHubConfig | null
  hasOAuth: boolean
  installations: GitHubInstallation[]
  repositories: GitHubRepository[]

  // ─── Integrations ──────────────────────────────────────────────────────
  integrations: Record<string, IntegrationConfig>

  // ─── Environment Variables ─────────────────────────────────────────────
  envVars: Record<string, string>

  // ─── Template ──────────────────────────────────────────────────────────
  template: string | null

  // ─── Domains ───────────────────────────────────────────────────────────
  domains: string[]

  // ─── Analytics ─────────────────────────────────────────────────────────
  analyticsProvider: string | null

  // ─── Preferences ───────────────────────────────────────────────────────
  theme: "system" | "light" | "dark"

  // ─── UI State ──────────────────────────────────────────────────────────
  saving: boolean
  message: SaveMessage | null
  activeSection: string

  // ─── Actions ───────────────────────────────────────────────────────────
  setGithub: (github: GitHubConfig | null) => void
  setHasOAuth: (hasOAuth: boolean) => void
  setInstallations: (installations: GitHubInstallation[]) => void
  setRepositories: (repositories: GitHubRepository[]) => void
  setIntegration: (name: string, config: IntegrationConfig) => void
  removeIntegration: (name: string) => void
  setEnvVar: (key: string, value: string) => void
  deleteEnvVar: (key: string) => void
  setTemplate: (template: string | null) => void
  addDomain: (domain: string) => void
  removeDomain: (domain: string) => void
  setAnalyticsProvider: (provider: string | null) => void
  setTheme: (theme: "system" | "light" | "dark") => void
  setSaving: (saving: boolean) => void
  setMessage: (message: SaveMessage | null) => void
  setActiveSection: (section: string) => void
  hydrate: (data: Partial<SettingsState>) => void
  reset: () => void
}

// ─── Initial State ─────────────────────────────────────────────────────────

const initialState = {
  github: null,
  hasOAuth: false,
  installations: [],
  repositories: [],
  integrations: {},
  envVars: {},
  template: null,
  domains: [],
  analyticsProvider: null,
  theme: "system" as const,
  saving: false,
  message: null,
  activeSection: "github",
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,

      // ── GitHub ─────────────────────────────────────────────────────
      setGithub: (github) => set({ github }),
      setHasOAuth: (hasOAuth) => set({ hasOAuth }),
      setInstallations: (installations) => set({ installations }),
      setRepositories: (repositories) => set({ repositories }),

      // ── Integrations ───────────────────────────────────────────────
      setIntegration: (name, config) =>
        set((state) => ({
          integrations: { ...state.integrations, [name]: config },
        })),

      removeIntegration: (name) =>
        set((state) => {
          const { [name]: _, ...rest } = state.integrations
          return { integrations: rest }
        }),

      // ── Environment Variables ──────────────────────────────────────
      setEnvVar: (key, value) =>
        set((state) => ({
          envVars: { ...state.envVars, [key]: value },
        })),

      deleteEnvVar: (key) =>
        set((state) => {
          const { [key]: _, ...rest } = state.envVars
          return { envVars: rest }
        }),

      // ── Template ───────────────────────────────────────────────────
      setTemplate: (template) => set({ template }),

      // ── Domains ────────────────────────────────────────────────────
      addDomain: (domain) =>
        set((state) => ({
          domains: [...new Set([...state.domains, domain])],
        })),

      removeDomain: (domain) =>
        set((state) => ({
          domains: state.domains.filter((d) => d !== domain),
        })),

      // ── Analytics ──────────────────────────────────────────────────
      setAnalyticsProvider: (provider) => set({ analyticsProvider: provider }),

      // ── Preferences ────────────────────────────────────────────────
      setTheme: (theme) => set({ theme }),

      // ── UI State ──────────────────────────────────────────────────
      setSaving: (saving) => set({ saving }),
      setMessage: (message) => set({ message }),
      setActiveSection: (section) => set({ activeSection: section }),

      hydrate: (data) => set(data),
      reset: () => set(initialState),
    }),
    {
      name: "flowzone-settings",
      partialize: (s) => ({
        // Persist GitHub integration state so it survives page refreshes
        github: s.github,
        hasOAuth: s.hasOAuth,
        installations: s.installations,
        repositories: s.repositories,
      }),
    }
  )
)
