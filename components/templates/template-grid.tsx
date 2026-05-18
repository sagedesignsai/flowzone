"use client"

import { Separator } from "@/components/ui/separator"
import { TemplateCard } from "@/components/templates/template-card"
import { cn } from "@/lib/utils"
import type { Template } from "@/stores/template-store"

// ─── Props ─────────────────────────────────────────────────────────────────

interface TemplateGridProps {
  templates: Template[]
  onSelect?: (template: Template) => void
  className?: string
  totalCount?: number
  title?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

export function TemplateGrid({
  templates,
  onSelect,
  className,
  totalCount,
  title,
}: TemplateGridProps) {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No templates found in this category.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {(title || totalCount !== undefined) && (
        <div className="flex items-center gap-3">
          {title && (
            <h2 className="text-sm font-medium text-foreground">{title}</h2>
          )}
          {totalCount !== undefined && (
            <span className="text-xs text-muted-foreground">
              {totalCount} {totalCount === 1 ? "template" : "templates"}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Category Section ──────────────────────────────────────────────────────

interface TemplateCategorySectionProps {
  categoryLabel: string
  templates: Template[]
  onSelect?: (template: Template) => void
  className?: string
}

export function TemplateCategorySection({
  categoryLabel,
  templates,
  onSelect,
  className,
}: TemplateCategorySectionProps) {
  if (templates.length === 0) return null

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h3 className="text-sm font-medium">{categoryLabel}</h3>
        <Separator />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
