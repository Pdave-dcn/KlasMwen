import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Report } from "@/zodSchemas/report.zod";

interface ReportsTableProps {
  reports: Report[];
  onViewDetails: (report: Report) => void;
  onToggleHidden: (reportId: number) => void;
  onMarkReviewed: (reportId: number) => void;
  onDismiss: (reportId: number) => void;
  isTogglingVisibility?: boolean;
  isUpdatingStatus?: boolean;
}

// Column definitions
const TABLE_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "content", label: "Content" },
  { key: "reporter", label: "Reporter" },
  { key: "reason", label: "Reason" },
  { key: "status", label: "Status" },
  { key: "date", label: "Date" },
  { key: "actions", label: "Actions" },
] as const;

const getStatusBadge = (status: Report["status"]) => {
  const variants = {
    PENDING: "bg-pending text-pending-foreground",
    REVIEWED: "bg-reviewed text-reviewed-foreground",
    DISMISSED: "bg-dismissed text-dismissed-foreground",
  };

  return (
    <Badge className={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </Badge>
  );
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const ReportsTable = ({
  reports,
  onViewDetails,
  onToggleHidden,
  onMarkReviewed,
  onDismiss,
  isTogglingVisibility = false,
  isUpdatingStatus = false,
}: ReportsTableProps) => {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              {TABLE_COLUMNS.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reports.map((report) => (
              <tr
                key={report.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {`RPT-${report.id}`}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {report.contentType}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                        {report.contentType === "post"
                          ? report.post?.title
                          : report.comment?.content}
                      </p>
                      {report.isContentHidden && (
                        <Badge
                          variant="outline"
                          className="mt-1 bg-destructive/10 text-destructive border-destructive/20"
                        >
                          Hidden
                        </Badge>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium">
                      {report.reporter.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {report.reporter.email}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {report.reason.label}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(report.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(report.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDetails(report)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onToggleHidden(report.id)}
                      title={
                        report.isContentHidden ? "Show content" : "Hide content"
                      }
                      disabled={isTogglingVisibility}
                    >
                      {report.isContentHidden ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    {report.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMarkReviewed(report.id)}
                          title="Mark as reviewed"
                          disabled={isUpdatingStatus}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDismiss(report.id)}
                          title="Dismiss report"
                          disabled={isUpdatingStatus}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
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
