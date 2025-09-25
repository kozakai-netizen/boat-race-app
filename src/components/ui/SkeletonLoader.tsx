interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-ink-line rounded ${className}`} />
  )
}

export function EntryRowSkeleton() {
  return (
    <div className="min-w-0 grid grid-cols-[28px_minmax(0,1fr)_80px_80px_72px_72px] items-center gap-2 h-12 border-t border-ink-line px-3">
      {/* Frame number */}
      <div className="w-6 h-6 bg-ink-line rounded-full animate-pulse" />

      {/* Name */}
      <div className="min-w-0">
        <Skeleton className="h-4 w-20 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>

      {/* Stats columns */}
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-4 w-10" />
      <Skeleton className="h-4 w-10" />
    </div>
  )
}

export function RaceListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-surface-1 border border-ink-line rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          <div className="space-y-2">
            {[...Array(3)].map((_, j) => (
              <EntryRowSkeleton key={j} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function RaceDetailSkeleton() {
  return (
    <div className="space-y-4">
      {/* Race header */}
      <div className="bg-surface-1 border border-ink-line rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>

      {/* Entry rows */}
      <div className="bg-surface-1 border border-ink-line rounded-lg overflow-hidden">
        <div className="p-4 border-b border-ink-line">
          <Skeleton className="h-5 w-24" />
        </div>
        <div>
          {[...Array(6)].map((_, i) => (
            <EntryRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}