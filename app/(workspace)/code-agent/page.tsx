import { GlobalHeader } from "@/components/layout/global-header"
import { CodeAgentIndexContent } from "@/components/workspace/code-agent/code-agent-index-content"

export const metadata = {
  title: "Code Agent — Flowzone",
  description: "Start a code agent chat with interactive PTY terminal access inside a secure sandbox.",
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
