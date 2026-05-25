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

const TEMPLATES = [
  { id: "next-app", name: "Next.js App" },
  { id: "react-spa", name: "React SPA" },
  { id: "vue-app", name: "Vue App" },
  { id: "svelte-app", name: "Svelte App" },
]

export function TemplateSection() {
  const template = useSettingsStore((s) => s.template)
  const setTemplate = useSettingsStore((s) => s.setTemplate)
  const setSaving = useSettingsStore((s) => s.setSaving)
  const setMessage = useSettingsStore((s) => s.setMessage)
  const [selectedTemplate, setSelectedTemplate] = useState(template || "")

  const handleSave = async () => {
    if (!selectedTemplate) {
      setMessage({ type: "error", text: "Please select a template" })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: selectedTemplate }),
      })

      if (res.ok) {
        setTemplate(selectedTemplate)
        setMessage({ type: "success", text: "Template updated successfully" })
      } else {
        throw new Error("Failed to update template")
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update template",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Project Template</h3>
        <p className="text-xs text-muted-foreground">
          Choose a template for new projects.
        </p>
      </div>

      <div className="space-y-3">
        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {TEMPLATES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleSave} className="w-full">
          Save Template
        </Button>
      </div>

      {template && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium">Current Template</p>
          <p className="text-xs text-muted-foreground">
            {TEMPLATES.find((t) => t.id === template)?.name}
          </p>
        </div>
      )}
    </div>
  )
}
