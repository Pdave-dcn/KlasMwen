import { useState, useEffect } from "react";

import { DashboardSkeleton } from "@/features/dashboards/modDashboard/components/DashboardSkeleton";
import { EmptyReportsState } from "@/features/dashboards/modDashboard/components/EmptyReportState";
import { Pagination } from "@/features/dashboards/modDashboard/components/Pagination";
import { ReportErrorState } from "@/features/dashboards/modDashboard/components/ReportErrorState";
import { ReportFilters as ReportFiltersComponent } from "@/features/dashboards/modDashboard/components/ReportFilters";
import { ReportModal } from "@/features/dashboards/modDashboard/components/ReportModal";
import { ReportsTable } from "@/features/dashboards/modDashboard/components/ReportsTable";
import { ReportsTableSkeleton } from "@/features/dashboards/modDashboard/components/ReportsTableSkeleton";
import { ReportStatsCards } from "@/features/dashboards/modDashboard/components/ReportStatsCards";
import { useModalState } from "@/features/dashboards/modDashboard/hooks/useModalState";
import { usePagination } from "@/features/dashboards/modDashboard/hooks/usePagination";
import { useReportManagement } from "@/features/dashboards/modDashboard/hooks/useReportManagement";
import { useReportReasonsQuery, useReportsQuery } from "@/queries/report.query";
import type { Report, ReportsQueryParams } from "@/zodSchemas/report.zod";

const ITEMS_PER_PAGE = 10;

const ModDashboard = () => {
  const [filters, setFilters] = useState<ReportsQueryParams>({});

  // Modal state management
  const reportModal = useModalState<Report>();

  // Pagination state management
  const pagination = usePagination();

  // Data queries
  const {
    data: reportData,
    isLoading: reportLoading,
    error: reportError,
    refetch: refetchReports,
  } = useReportsQuery({
    ...filters,
    page: pagination.currentPage,
    limit: ITEMS_PER_PAGE,
  });

  const {
    data: reportReasons,
    isLoading: reasonLoading,
    error: reasonError,
    refetch: refetchReasons,
  } = useReportReasonsQuery();

  // Report management logic
  const { handlers, isMutating } = useReportManagement();

  // Update pagination metadata when data loads
  useEffect(() => {
    if (reportData?.pagination) {
      pagination.setMeta(reportData.pagination);
    }
  }, [reportData?.pagination]);

  const handleRetry = async () => {
    await refetchReports();
    await refetchReasons();
  };

  // Initial loading state (first load only)
  const isInitialLoading =
    (reportLoading || reasonLoading) && !reportData && !reportReasons;

  // Show full page skeleton only on initial load
  if (isInitialLoading) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (reportError || reasonError) {
    return <ReportErrorState onRetry={handleRetry} />;
  }

  const reports = reportData?.data ?? [];
  const paginationProps = pagination.getProps();

  // Handle filter changes - reset to first page
  const handleFiltersChange = (newFilters: ReportsQueryParams) => {
    setFilters(newFilters);
    pagination.reset();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold">Reports Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage and review user reports for KlasMwen
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <ReportStatsCards />

        {/* Filters */}
        <div className="mb-6">
          <ReportFiltersComponent
            filters={filters}
            reportReasons={reportReasons ?? []}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {/* Reports Table */}
        <div className="mb-6">
          {reportLoading ? (
            <ReportsTableSkeleton />
          ) : reports.length === 0 ? (
            <EmptyReportsState />
          ) : (
            <ReportsTable
              reports={reports}
              onViewDetails={reportModal.open}
              onToggleHidden={handlers.handleToggleHidden}
              onMarkReviewed={handlers.handleMarkReviewed}
              onDismiss={handlers.handleDismiss}
              isTogglingVisibility={isMutating}
              isUpdatingStatus={isMutating}
            />
          )}
        </div>

        {/* Pagination */}
        {paginationProps && (
          <Pagination
            {...paginationProps}
            itemsPerPage={ITEMS_PER_PAGE}
            showResultsText
          />
        )}
      </div>

      {/* Report Detail Modal */}
      <ReportModal
        report={reportModal.data}
        isOpen={reportModal.isOpen}
        onClose={reportModal.close}
        onUpdateStatus={handlers.handleUpdateStatus}
        onToggleHidden={handlers.handleToggleHidden}
        onUpdateNotes={handlers.handleUpdateNotes}
        onDelete={handlers.handleDelete}
      />
    </div>
  );
};

export default ModDashboard;
