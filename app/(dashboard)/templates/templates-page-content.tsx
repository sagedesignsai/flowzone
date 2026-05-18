"use client"

import { TemplateGrid, TemplateCategorySection } from "@/components/templates/template-grid"
import { useIdeStore } from "@/hooks/use-ide-store"
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplatesByCategory,
  useTemplateFilter,
  type Template,
} from "@/stores/template-store"
import { useRouter } from "nextjs-toploader/app"
import { nanoid } from "nanoid"
import { cn } from "@/lib/utils"

const ALL_CATEGORY = { id: "all" as const, label: "All" }

export function TemplatesPageContent() {
  const router = useRouter()
  const { addChatSession, setActiveChatId } = useIdeStore()
  const activeCategory = useTemplateFilter((s) => s.activeCategory)
  const setActiveCategory = useTemplateFilter((s) => s.setActiveCategory)

  const categories = [ALL_CATEGORY, ...TEMPLATE_CATEGORIES]

  const filteredTemplates =
    activeCategory === "all"
      ? TEMPLATES
      : getTemplatesByCategory(activeCategory as Template["category"])

  function handleSelect(template: Template) {
    const id = nanoid()
    addChatSession({
      id,
      title: template.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    setActiveChatId(id)
    router.push(`/chat/${id}?q=${encodeURIComponent(template.prompt)}`)
  }

  return (
    <div className="space-y-6">
      {/* ── Category filter pills ───────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Template grid ───────────────────────────────────────── */}
      {activeCategory === "all" ? (
        TEMPLATE_CATEGORIES.map((cat) => {
          const catTemplates = getTemplatesByCategory(cat.id)
          if (catTemplates.length === 0) return null
          return (
            <TemplateCategorySection
              key={cat.id}
              categoryLabel={cat.label}
              templates={catTemplates}
              onSelect={handleSelect}
            />
          )
        })
      ) : (
        <TemplateGrid
          templates={filteredTemplates}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}
