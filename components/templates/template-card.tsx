"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Template } from "@/stores/template-store"

// ─── Props ─────────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: Template
  onSelect?: (template: Template) => void
  className?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

export function TemplateCard({
  template,
  onSelect,
  className,
}: TemplateCardProps) {
  const Icon = template.icon

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onSelect?.(template)
    }
  }

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
        className
      )}
      onClick={() => onSelect?.(template)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {template.category}
          </Badge>
        </div>
        <CardTitle className="mt-3 text-sm font-semibold">
          {template.name}
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          {template.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-3">
        <ul className="space-y-1">
          {template.features.slice(0, 3).map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
            >
              <span className="size-1 rounded-full bg-primary/60" />
              {feature}
            </li>
          ))}
          {template.features.length > 3 && (
            <li className="text-[11px] text-muted-foreground/60">
              +{template.features.length - 3} more
            </li>
          )}
        </ul>
      </CardContent>

      <CardFooter className="border-t pt-3">
        <span className="text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Use this template →
        </span>
      </CardFooter>
    </Card>
  )
}
