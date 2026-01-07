import { Skeleton } from "@/components/ui/skeleton";

export const NotificationSkeleton = () => {
  return (
    <div className="flex items-start gap-3 rounded-lg p-3">
      {/* Avatar Skeleton */}
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />

      {/* Content Skeleton */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
        <Skeleton className="h-3 w-1/2" />
      </div>

      {/* Icon Skeleton */}
      <Skeleton className="h-4 w-4 shrink-0 rounded" />
    </div>
  );
};
