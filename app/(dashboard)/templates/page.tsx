import { TemplatesPageContent } from "./templates-page-content"

export const metadata = {
  title: "Templates — Flowzone",
  description: "Choose a template to jump-start your next project.",
}

export default function TemplatesPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-base font-semibold">Templates</h1>
        <p className="text-xs text-muted-foreground">
          Choose a template to jump-start your next project.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <TemplatesPageContent />
      </div>
    </div>
  )
}
