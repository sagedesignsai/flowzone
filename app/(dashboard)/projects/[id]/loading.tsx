import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-1 h-3 w-52" />
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>

        {/* Recent chats header */}
        <Skeleton className="mb-3 h-4 w-24" />

        {/* Chats */}
        <div className="space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  )
}
