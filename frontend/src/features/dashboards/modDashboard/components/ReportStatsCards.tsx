import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  EyeOff,
} from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/features/dashboards/modDashboard/components/StatCard";
import { useReportStatsQuery } from "@/queries/report.query";

export const ReportStatsCards = () => {
  const { data: stats, isLoading, error } = useReportStatsQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="flex items-center justify-center h-24 bg-card border border-border rounded-lg">
          <Spinner />
        </div>
        <div className="flex items-center justify-center h-24 bg-card border border-border rounded-lg">
          <Spinner />
        </div>
        <div className="flex items-center justify-center h-24 bg-card border border-border rounded-lg">
          <Spinner />
        </div>
        <div className="flex items-center justify-center h-24 bg-card border border-border rounded-lg">
          <Spinner />
        </div>
        <div className="flex items-center justify-center h-24 bg-card border border-border rounded-lg">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-center">
        <p className="font-medium">Failed to load statistics</p>
        <p className="text-sm mt-1">Please try refreshing the page</p>
      </div>
    );
  }

  // Provide fallback values if stats are somehow undefined
  const {
    totalReports = 0,
    pending = 0,
    reviewed = 0,
    dismissed = 0,
    hiddenContent = 0,
  } = stats ?? {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      <StatCard
        title="Total Reports"
        value={totalReports}
        icon={FileText}
        variant="default"
      />
      <StatCard
        title="Pending"
        value={pending}
        icon={AlertTriangle}
        variant="pending"
      />
      <StatCard
        title="Reviewed"
        value={reviewed}
        icon={CheckCircle}
        variant="reviewed"
      />
      <StatCard
        title="Dismissed"
        value={dismissed}
        icon={XCircle}
        variant="dismissed"
      />
      <StatCard
        title="Hidden Content"
        value={hiddenContent}
        icon={EyeOff}
        variant="default"
      />
    </div>
  );
};
