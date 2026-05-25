"use client"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  action?: () => void
  href?: string
  group: string
}

interface CommandPaletteProps {
  items: CommandItem[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CommandPalette({
  items,
  open: controlledOpen,
  onOpenChange,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(controlledOpen ?? false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  const groupedItems = items.reduce(
    (acc, item) => {
      if (!acc[item.group]) acc[item.group] = []
      acc[item.group].push(item)
      return acc
    },
    {} as Record<string, CommandItem[]>
  )

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput placeholder="Search settings, pages, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedItems).map(([group, groupItems]) => (
          <CommandGroup key={group} heading={group}>
            {groupItems.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => {
                  if (item.href) {
                    router.push(item.href)
                  } else if (item.action) {
                    item.action()
                  }
                  handleOpenChange(false)
                }}
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium">{item.label}</span>
                  {item.description && (
                    <span className="text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
