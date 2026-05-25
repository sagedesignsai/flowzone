"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSettingsStore } from "@/stores/settings-store"
import { Trash, Plus, Eye, EyeSlash } from "@phosphor-icons/react"
import { useState, useEffect } from "react"

export function EnvVarsSection() {
  const envVars = useSettingsStore((s) => s.envVars)
  const setEnvVar = useSettingsStore((s) => s.setEnvVar)
  const deleteEnvVar = useSettingsStore((s) => s.deleteEnvVar)
  const setSaving = useSettingsStore((s) => s.setSaving)
  const setMessage = useSettingsStore((s) => s.setMessage)

  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [visibleValues, setVisibleValues] = useState<Set<string>>(new Set())

  // Load env vars on mount
  useEffect(() => {
    const loadEnvVars = async () => {
      try {
        const res = await fetch("/api/settings/env-vars")
        if (res.ok) {
          const data = await res.json()
          Object.entries(data.envVars || {}).forEach(([key, value]) => {
            setEnvVar(key, value as string)
          })
        }
      } catch (err) {
        console.error("Failed to load env vars:", err)
      }
    }

    loadEnvVars()
  }, [setEnvVar])

  const handleAddEnvVar = async () => {
    if (!newKey.trim() || !newValue.trim()) {
      setMessage({ type: "error", text: "Key and value are required" })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/settings/env-vars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey, value: newValue, action: "set" }),
      })

      if (res.ok) {
        setEnvVar(newKey, newValue)
        setNewKey("")
        setNewValue("")
        setMessage({ type: "success", text: "Environment variable added" })
      } else {
        throw new Error("Failed to add environment variable")
      }
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to add environment variable",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEnvVar = async (key: string) => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings/env-vars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, action: "delete" }),
      })

      if (res.ok) {
        deleteEnvVar(key)
        setMessage({ type: "success", text: "Environment variable deleted" })
      } else {
        throw new Error("Failed to delete environment variable")
      }
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to delete environment variable",
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleValueVisibility = (key: string) => {
    const newVisible = new Set(visibleValues)
    if (newVisible.has(key)) {
      newVisible.delete(key)
    } else {
      newVisible.add(key)
    }
    setVisibleValues(newVisible)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Environment Variables</h3>
        <p className="text-xs text-muted-foreground">
          Add environment variables for your project.
        </p>
      </div>

      {/* Add new env var */}
      <div className="space-y-2 rounded-lg border border-border p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="Key"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="text-xs"
          />
          <Input
            placeholder="Value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            type="password"
            className="text-xs"
          />
        </div>
        <Button size="sm" onClick={handleAddEnvVar} className="w-full gap-1.5">
          <Plus className="size-3.5" />
          Add Variable
        </Button>
      </div>

      {/* List env vars */}
      {Object.entries(envVars).length > 0 ? (
        <div className="space-y-2">
          {Object.entries(envVars).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 rounded-lg border border-border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs font-medium">{key}</p>
                <p className="text-xs text-muted-foreground">
                  {visibleValues.has(key) ? value : "••••••••"}
                </p>
              </div>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => toggleValueVisibility(key)}
              >
                {visibleValues.has(key) ? (
                  <EyeSlash className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => handleDeleteEnvVar(key)}
              >
                <Trash className="size-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">
            No environment variables yet
          </p>
        </div>
      )}
    </div>
  )
}
