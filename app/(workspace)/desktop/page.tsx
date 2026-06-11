import { GlobalHeader } from "@/components/layout/global-header"
import { DesktopIndexContent } from "@/components/workspace/desktop/desktop-index-content"

export const metadata = {
  title: "Desktop — Flowzone",
  description: "Start a desktop workspace chat.",
}

export default function DesktopIndexPage() {
  return (
    <>
      <GlobalHeader breadcrumb="Desktop" />
      <main className="flex flex-1 overflow-hidden">
        <DesktopIndexContent />
      </main>
    </>
  )
}
