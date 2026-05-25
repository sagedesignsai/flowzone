import type { ReactNode } from "react"

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl p-6">
        {children}
      </div>
    </div>
  )
}
