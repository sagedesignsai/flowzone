import { GlobalHeader } from "@/components/layout/global-header"
import { VirtualDevPtyIndexContent } from "@/components/workspace/virtual-dev-pty/virtual-dev-pty-index-content"

export const metadata = {
  title: "Virtual Developer PTY — Flowzone",
  description: "Start a virtual developer chat with PTY terminal access.",
}

export default function VirtualDevPtyIndexPage() {
  return (
    <>
      <GlobalHeader breadcrumb="Virtual Developer" />
      <main className="flex flex-1 overflow-hidden">
        <VirtualDevPtyIndexContent />
      </main>
    </>
  )
}
