import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Statistics Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={`element-${i + 1}`}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-5 rounded" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <Skeleton className="h-6 w-20 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={`element-${i + 1}`}>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  {[...Array(7)].map((_, i) => (
                    <th
                      key={`element-${i + 1}`}
                      className="px-6 py-3 text-left"
                    >
                      <Skeleton className="h-4 w-16" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...Array(10)].map((_, rowIndex) => (
                  <tr key={`row-${rowIndex + 1}`}>
                    {[...Array(7)].map((_, colIndex) => (
                      <td key={`col-${colIndex + 1}`} className="px-6 py-4">
                        {colIndex === 1 ? (
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        ) : colIndex === 2 ? (
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        ) : colIndex === 6 ? (
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        ) : (
                          <Skeleton className="h-4 w-full max-w-[100px]" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            {[...Array(3)].map((_, i) => (
              <Skeleton key={`element-${i + 1}`} className="h-9 w-9" />
            ))}
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
};
