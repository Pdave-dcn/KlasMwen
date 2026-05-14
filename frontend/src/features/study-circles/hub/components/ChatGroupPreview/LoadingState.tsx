import { Skeleton } from "@/components/ui/skeleton";

export const DetailSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex items-start gap-5">
              <Skeleton className="h-20 w-20 rounded-2xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
          <div className="w-full md:w-72 space-y-4">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
