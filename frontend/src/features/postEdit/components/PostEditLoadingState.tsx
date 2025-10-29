import { Skeleton } from "@/components/ui/skeleton";

export const PostEditLoadingState = () => (
  <div className="space-y-6 p-4">
    {/* Dialog Header Skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-64" />
    </div>

    {/* Title Field Skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-5 w-12" />
      <Skeleton className="h-10 w-full" />
    </div>

    {/* Content Field Skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-[350px] w-full" />
    </div>

    {/* Tags Selector Skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-5 w-10" />
      <div className="flex gap-2 flex-wrap">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>

    {/* Action Buttons Skeleton */}
    <div className="flex gap-3 pt-4">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 flex-1" />
    </div>
  </div>
);
