"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSettingsStore } from "@/stores/settings-store"
import { Trash, Plus, Globe } from "@phosphor-icons/react"
import { useState, useEffect } from "react"

export function DomainsSection() {
  const domains = useSettingsStore((s) => s.domains)
  const addDomain = useSettingsStore((s) => s.addDomain)
  const removeDomain = useSettingsStore((s) => s.removeDomain)
  const setSaving = useSettingsStore((s) => s.setSaving)
  const setMessage = useSettingsStore((s) => s.setMessage)
  const [newDomain, setNewDomain] = useState("")

  // Load domains on mount
  useEffect(() => {
    const loadDomains = async () => {
      try {
        const res = await fetch("/api/settings/domains")
        if (res.ok) {
          const data = await res.json()
          data.domains?.forEach((domain: string) => addDomain(domain))
        }
      } catch (err) {
        console.error("Failed to load domains:", err)
      }
    }

    loadDomains()
  }, [addDomain])

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      setMessage({ type: "error", text: "Domain is required" })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/settings/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain, action: "add" }),
      })

      if (res.ok) {
        addDomain(newDomain)
        setNewDomain("")
        setMessage({ type: "success", text: "Domain added successfully" })
      } else {
        throw new Error("Failed to add domain")
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to add domain",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveDomain = async (domain: string) => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, action: "remove" }),
      })

      if (res.ok) {
        removeDomain(domain)
        setMessage({ type: "success", text: "Domain removed" })
      } else {
        throw new Error("Failed to remove domain")
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to remove domain",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Custom Domains</h3>
        <p className="text-xs text-muted-foreground">
          Add custom domains for your projects.
        </p>
      </div>

      {/* Add new domain */}
      <div className="space-y-2 rounded-lg border border-border p-4">
        <div className="flex gap-2">
          <Input
            placeholder="example.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            className="text-xs"
          />
          <Button size="sm" onClick={handleAddDomain} className="gap-1.5">
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
      </div>

      {/* List domains */}
      {domains.length > 0 ? (
        <div className="space-y-2">
          {domains.map((domain) => (
            <div
              key={domain}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-muted-foreground" />
                <p className="text-sm font-mono">{domain}</p>
              </div>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => handleRemoveDomain(domain)}
              >
                <Trash className="size-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">
            No custom domains yet
          </p>
        </div>
      )}
    </div>
  )
}
