"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { ChatEnvironment } from "@/hooks/use-ide-store"

interface EnvironmentSelectorProps {
  value: ChatEnvironment
  onChange: (env: ChatEnvironment) => void
  className?: string
}

const ENVIRONMENTS: {
  value: ChatEnvironment
  label: string
  description: string
}[] = [
  {
    value: "code-agent",
    label: "Code Agent",
    description: "Interactive terminal + AI agent",
  },
  {
    value: "desktop",
    label: "Desktop",
    description: "Linux desktop + VNC",
  },
]

export function EnvironmentSelector({
  value,
  onChange,
  className,
}: EnvironmentSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ChatEnvironment)}>
      <SelectTrigger
        className={cn(
          "h-7 gap-1 border-none bg-transparent px-1.5 text-xs",
          "font-medium text-muted-foreground shadow-none",
          "hover:bg-accent hover:text-foreground",
          "aria-expanded:bg-accent aria-expanded:text-foreground",
          "focus:ring-0",
          className,
        )}
      >
        <SelectValue aria-label={value}>
          {ENVIRONMENTS.find((e) => e.value === value)?.label ?? "Code"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {ENVIRONMENTS.map((env) => (
          <SelectItem key={env.value} value={env.value}>
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span>{env.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {env.description}
                </span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
