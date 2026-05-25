"use client"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { useSettingsStore } from "@/stores/settings-store"
import { Plugs, Check, Link as LinkIcon } from "@phosphor-icons/react"
import { useEffect } from "react"

const INTEGRATIONS = [
  { id: "slack", name: "Slack", icon: "💬" },
  { id: "discord", name: "Discord", icon: "🎮" },
  { id: "telegram", name: "Telegram", icon: "✈️" },
]

export function IntegrationsSection() {
  const integrations = useSettingsStore((s) => s.integrations)
  const setIntegration = useSettingsStore((s) => s.setIntegration)
  const removeIntegration = useSettingsStore((s) => s.removeIntegration)
  const setSaving = useSettingsStore((s) => s.setSaving)
  const setMessage = useSettingsStore((s) => s.setMessage)

  // Load integrations on mount
  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        const res = await fetch("/api/settings/integrations")
        if (res.ok) {
          const data = await res.json()
          Object.entries(data.integrations || {}).forEach(([name, config]) => {
            setIntegration(name, config as any)
          })
        }
      } catch (err) {
        console.error("Failed to load integrations:", err)
      }
    }

    loadIntegrations()
  }, [setIntegration])

  const handleConnect = async (integrationId: string) => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integration: integrationId,
          action: "connect",
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setIntegration(integrationId, data.integration)
        setMessage({
          type: "success",
          text: `${integrationId} connected successfully`,
        })
      } else {
        throw new Error(`Failed to connect ${integrationId}`)
      }
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error ? err.message : "Failed to connect integration",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integration: integrationId,
          action: "disconnect",
        }),
      })

      if (res.ok) {
        removeIntegration(integrationId)
        setMessage({
          type: "success",
          text: `${integrationId} disconnected`,
        })
      } else {
        throw new Error(`Failed to disconnect ${integrationId}`)
      }
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to disconnect integration",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Integrations</h3>
        <p className="text-xs text-muted-foreground">
          Connect third-party services to enhance your workflow.
        </p>
      </div>

      <div className="grid gap-3">
        {INTEGRATIONS.map((integration) => {
          const isConnected = integrations[integration.id]?.connected
          return (
            <div
              key={integration.id}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{integration.icon}</div>
                <div>
                  <p className="text-sm font-medium">{integration.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {isConnected ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
              {isConnected ? (
                <ButtonGroup>
                  <Button size="icon-xs" variant="outline" disabled>
                    <Check className="size-3.5 text-green-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDisconnect(integration.id)}
                  >
                    Disconnect
                  </Button>
                </ButtonGroup>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleConnect(integration.id)}
                  className="gap-1.5"
                >
                  <LinkIcon className="size-3.5" />
                  Connect
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
