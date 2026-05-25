"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSettingsStore } from "@/stores/settings-store"
import { useState, useEffect } from "react"

const ANALYTICS_PROVIDERS = [
  { id: "google", name: "Google Analytics" },
  { id: "mixpanel", name: "Mixpanel" },
  { id: "amplitude", name: "Amplitude" },
  { id: "posthog", name: "PostHog" },
]

export function AnalyticsSection() {
  const analyticsProvider = useSettingsStore((s) => s.analyticsProvider)
  const setAnalyticsProvider = useSettingsStore((s) => s.setAnalyticsProvider)
  const setSaving = useSettingsStore((s) => s.setSaving)
  const setMessage = useSettingsStore((s) => s.setMessage)
  const [selectedProvider, setSelectedProvider] = useState(analyticsProvider || "")

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyticsProvider: selectedProvider || null }),
      })

      if (res.ok) {
        setAnalyticsProvider(selectedProvider || null)
        setMessage({ type: "success", text: "Analytics settings updated" })
      } else {
        throw new Error("Failed to update analytics settings")
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update analytics settings",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Analytics Provider</h3>
        <p className="text-xs text-muted-foreground">
          Choose an analytics provider to track user behavior.
        </p>
      </div>

      <div className="space-y-3">
        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="Select a provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {ANALYTICS_PROVIDERS.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleSave} className="w-full">
          Save Analytics Settings
        </Button>
      </div>

      {analyticsProvider && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium">Current Provider</p>
          <p className="text-xs text-muted-foreground">
            {ANALYTICS_PROVIDERS.find((p) => p.id === analyticsProvider)?.name}
          </p>
        </div>
      )}
    </div>
  )
}
