export default function RootLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-sm bg-foreground">
          <span className="text-xs font-bold text-background">F</span>
        </div>
        <div className="size-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    </div>
  )
}
