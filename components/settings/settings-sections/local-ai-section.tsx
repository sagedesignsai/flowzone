"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useSettingsStore } from "@/stores/settings-store"
import {
  LOCAL_MODELS,
  DEFAULT_LOCAL_MODEL_ID,
  type LocalModelConfig,
} from "@/lib/ai/models"
import {
  doesBrowserSupportTransformersJS,
  transformersJS,
} from "@browser-ai/transformers-js"
import { cn } from "@/lib/utils"
import { CheckCircle, Spinner, WarningCircle } from "@phosphor-icons/react"

// ─── Types ──────────────────────────────────────────────────────────────

type ModelStatus = "unknown" | "available" | "downloadable" | "unavailable" | "downloading" | "error"

interface ModelEntry {
  config: LocalModelConfig
  status: ModelStatus
  progress: number
}

// ─── Component ──────────────────────────────────────────────────────────

export function LocalAISection() {
  const localAiModelId = useSettingsStore((s) => s.localAiModelId)
  const setLocalAiModelId = useSettingsStore((s) => s.setLocalAiModelId)
  const activeModelId = localAiModelId ?? DEFAULT_LOCAL_MODEL_ID

  const [browserSupported, setBrowserSupported] = useState(false)
  const [models, setModels] = useState<ModelEntry[]>(() =>
    LOCAL_MODELS.map((c) => ({ config: c, status: "unknown" as const, progress: 0 })),
  )
  const checkingRef = useRef(false)

  // Check browser support on mount
  useEffect(() => {
    setBrowserSupported(doesBrowserSupportTransformersJS())
  }, [])

  // Check availability for all models on mount
  useEffect(() => {
    if (checkingRef.current || !browserSupported) return
    checkingRef.current = true

    const checkAll = async () => {
      for (let i = 0; i < LOCAL_MODELS.length; i++) {
        const model = LOCAL_MODELS[i]
        try {
          const instance = transformersJS(model.id)
          const availability = await instance.availability()
          setModels((prev) => {
            const next = [...prev]
            next[i] = { ...next[i], status: availability as ModelStatus }
            return next
          })
        } catch {
          setModels((prev) => {
            const next = [...prev]
            next[i] = { ...next[i], status: "error" }
            return next
          })
        }
      }
    }

    checkAll().finally(() => {
      checkingRef.current = false
    })
  }, [browserSupported])

  // ── Download handler ──────────────────────────────────────────────────

  const handleDownload = useCallback(
    async (modelId: string) => {
      const idx = LOCAL_MODELS.findIndex((m) => m.id === modelId)
      if (idx === -1) return

      setModels((prev) => {
        const next = [...prev]
        next[idx] = { ...next[idx], status: "downloading", progress: 0 }
        return next
      })

      try {
        const instance = transformersJS(modelId, {
          device: "webgpu",
        })

        const availability = await instance.availability()
        if (availability === "available") {
          setModels((prev) => {
            const next = [...prev]
            next[idx] = { ...next[idx], status: "available", progress: 100 }
            return next
          })
          return
        }

        await instance.createSessionWithProgress((progress: number) => {
          const percent = Math.round(progress * 100)
          setModels((prev) => {
            const next = [...prev]
            next[idx] = { ...next[idx], status: "downloading", progress: percent }
            return next
          })
        })

        setModels((prev) => {
          const next = [...prev]
          next[idx] = { ...next[idx], status: "available", progress: 100 }
          return next
        })
      } catch (err) {
        setModels((prev) => {
          const next = [...prev]
          next[idx] = {
            ...next[idx],
            status: "error",
            progress: 0,
          }
          return next
        })
        console.error("Failed to download model:", err)
      }
    },
    [],
  )

  // ── Clear handler ─────────────────────────────────────────────────────

  const handleClear = useCallback(async (modelId: string) => {
    const idx = LOCAL_MODELS.findIndex((m) => m.id === modelId)
    if (idx === -1) return

    // Clear the model from browser cache via Cache API
    try {
      const cache = await caches.open("transformers.js-cache")
      const requests = await cache.keys()
      const modelRequests = requests.filter((r) => r.url.includes(modelId))
      await Promise.all(modelRequests.map((r) => cache.delete(r)))

      setModels((prev) => {
        const next = [...prev]
        next[idx] = { ...next[idx], status: "downloadable", progress: 0 }
        return next
      })
    } catch {
      console.error("Failed to clear model cache")
    }
  }, [])

  // ── Status helpers ────────────────────────────────────────────────────

  const statusLabel = (status: ModelStatus) => {
    switch (status) {
      case "unknown": return "Checking..."
      case "available": return "Ready"
      case "downloadable": return "Not downloaded"
      case "unavailable": return "Not supported"
      case "downloading": return "Downloading..."
      case "error": return "Error"
    }
  }

  const statusIcon = (status: ModelStatus) => {
    switch (status) {
      case "available": return <CheckCircle className="size-3.5 text-emerald-400" />
      case "downloading": return <Spinner className="size-3.5 animate-spin text-muted-foreground" />
      case "error": return <WarningCircle className="size-3.5 text-destructive" />
      default: return null
    }
  }

  // ── Render ────────────────────────────────────────────────────────────

  if (!browserSupported) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Local AI Models</h3>
          <p className="text-xs text-muted-foreground">
            Run AI models directly in your browser using WebGPU.
          </p>
        </div>

        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            WebGPU not available
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Local inference requires a browser with WebGPU support (Chrome 113+,
            Edge 113+).
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold">Local AI Models</h3>
        <p className="text-xs text-muted-foreground">
          Select and manage models for browser-side inference. Models run
          entirely in your browser — no data leaves your machine.
        </p>
      </div>

      {/* Active model selector info */}
      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Active Model
        </p>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-sm font-medium">
            {LOCAL_MODELS.find((m) => m.id === activeModelId)?.name ??
              "Default"}
          </p>
          <p className="text-xs text-muted-foreground">
            {LOCAL_MODELS.find((m) => m.id === activeModelId)?.description ??
              ""}
          </p>
        </div>
      </div>

      {/* Model list */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Available Models
        </p>
        {models.map((entry) => {
          const isActive = entry.config.id === activeModelId
          return (
            <div
              key={entry.config.id}
              className={cn(
                "rounded-lg border p-3 transition-colors",
                isActive
                  ? "border-accent/40 bg-accent/5"
                  : "border-border bg-background",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="local-model"
                        checked={isActive}
                        onChange={() => setLocalAiModelId(entry.config.id)}
                        className="size-3 accent-foreground"
                      />
                      <span className="text-sm font-medium">
                        {entry.config.name}
                      </span>
                    </label>

                    {/* Status badge */}
                    {(entry.status === "available" ||
                      entry.status === "downloading" ||
                      entry.status === "error") && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]",
                          entry.status === "available" &&
                            "bg-emerald-500/10 text-emerald-400",
                          entry.status === "downloading" &&
                            "bg-blue-500/10 text-blue-400",
                          entry.status === "error" &&
                            "bg-destructive/10 text-destructive",
                        )}
                      >
                        {statusIcon(entry.status)}
                        {entry.status === "downloading" && entry.progress > 0
                          ? `${entry.progress}%`
                          : statusLabel(entry.status)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {entry.config.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    {entry.config.size}
                    {entry.config.dtype && ` · ${entry.config.dtype}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {(entry.status === "downloadable" ||
                    entry.status === "error") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(entry.config.id)}
                      disabled={entry.status === "downloading"}
                    >
                      {entry.status === "downloading"
                        ? "Downloading..."
                        : "Download"}
                    </Button>
                  )}
                  {entry.status === "available" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleClear(entry.config.id)}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Download progress bar */}
              {entry.status === "downloading" && entry.progress > 0 && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${entry.progress}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
