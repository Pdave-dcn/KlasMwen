import { Skeleton } from "@/components/ui/skeleton";

interface DiscoveryGridSkeletonProps {
  count?: number;
}

export function DiscoveryGridSkeleton({
  count = 6,
}: DiscoveryGridSkeletonProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`skeleton-${i + 1}`}
          className="flex flex-col p-5 rounded-2xl border border-border bg-card"
        >
          {/* Header: avatar + badge */}
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-16 rounded-full" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 mb-4 flex-1">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>

          {/* Tags */}
          <div className="flex gap-1.5 mb-4">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
