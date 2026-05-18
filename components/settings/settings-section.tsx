import type { ReactNode } from "react"

// ─── Props ─────────────────────────────────────────────────────────────────

interface SettingsSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SettingsSection({
  title,
  description,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section className={className}>
      <div className="space-y-1 pb-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="rounded-lg border bg-card p-5">{children}</div>
    </section>
  )
}
