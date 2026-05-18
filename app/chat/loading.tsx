import { Skeleton } from "@/components/ui/skeleton"

export default function ChatIndexLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
      <Skeleton className="size-16 rounded-2xl" />
      <div className="space-y-1.5 text-center">
        <Skeleton className="mx-auto h-5 w-28" />
        <Skeleton className="mx-auto h-4 w-56" />
      </div>
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
  )
}
