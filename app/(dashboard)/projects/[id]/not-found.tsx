import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ProjectNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
      <div className="space-y-1 text-center">
        <h2 className="text-sm font-semibold">Project not found</h2>
        <p className="text-xs text-muted-foreground">
          This project doesn&apos;t exist or you don&apos;t have access.
        </p>
      </div>
      <Button nativeButton={false} render={<Link href="/projects" />} size="sm">
        Back to projects
      </Button>
    </div>
  )
}
