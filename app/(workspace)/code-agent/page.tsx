import { GlobalHeader } from "@/components/layout/global-header"
import { CodeAgentIndexContent } from "@/components/workspace/code-agent/code-agent-index-content"

export const metadata = {
  title: "Code Agent — Flowzone",
  description: "Start a code agent chat powered by OpenCode.",
}

export default function CodeAgentIndexPage() {
  return (
    <>
      <GlobalHeader breadcrumb="Code Agent" />
      <main className="flex flex-1 overflow-hidden">
        <CodeAgentIndexContent />
      </main>
    </>
  )
}
