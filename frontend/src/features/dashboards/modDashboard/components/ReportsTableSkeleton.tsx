import { Skeleton } from "@/components/ui/skeleton";

export const ReportsTableSkeleton = () => {
  return (
    <div
      className="bg-card border border-border rounded-lg overflow-hidden"
      data-testid="reports-table-skeleton"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-8" />
              </th>
              <th className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-12" />
              </th>
              <th className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            </tr>
          </thead>

          {/* Table Body - Skeleton Rows */}
          <tbody className="divide-y divide-border">
            {Array.from({ length: 10 }).map((_, index) => (
              <tr key={`${index + 1}`} className="hover:bg-muted/50">
                {/* ID */}
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-16" />
                </td>

                {/* Content */}
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </td>

                {/* Reporter */}
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </td>

                {/* Reason */}
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-20" />
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>

                {/* Date */}
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-24" />
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
