"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MagnifyingGlass, X } from "@phosphor-icons/react"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: any, item: T) => React.ReactNode
  width?: string
}

interface DataGridProps<T extends { id: string }> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T) => void
  onDelete?: (item: T) => void
  searchable?: boolean
  searchFields?: (keyof T)[]
}

export function DataGrid<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  onDelete,
  searchable = true,
  searchFields = [],
}: DataGridProps<T>) {
  const [search, setSearch] = useState("")

  const filteredData = useMemo(() => {
    if (!search || searchFields.length === 0) return data

    return data.filter((item) =>
      searchFields.some((field) =>
        String(item[field]).toLowerCase().includes(search.toLowerCase())
      )
    )
  }, [data, search, searchFields])

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      )}

      <div className="space-y-2">
        {filteredData.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-xs text-muted-foreground">No results found</p>
          </div>
        ) : (
          filteredData.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between rounded-lg border border-border p-3 transition-colors",
                onRowClick && "cursor-pointer hover:bg-muted/50"
              )}
              onClick={() => onRowClick?.(item)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {columns.map((col) => (
                  <div
                    key={String(col.key)}
                    className={cn("text-xs", col.width)}
                  >
                    {col.render
                      ? col.render(item[col.key], item)
                      : String(item[col.key])}
                  </div>
                ))}
              </div>

              {onDelete && (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(item)
                  }}
                >
                  <X className="size-3.5 text-destructive" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
