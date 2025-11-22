/* eslint-disable complexity */
import { useState, useEffect } from "react";

import { Lock } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardSkeleton } from "@/features/dashboards/modDashboard/components/DashboardSkeleton";
import { EmptyReportsState } from "@/features/dashboards/modDashboard/components/EmptyReportState";
import { Pagination } from "@/features/dashboards/modDashboard/components/Pagination";
import { ReportErrorState } from "@/features/dashboards/modDashboard/components/ReportErrorState";
import { ReportFilters as ReportFiltersComponent } from "@/features/dashboards/modDashboard/components/ReportFilters/ReportFilters";
import { ReportModal } from "@/features/dashboards/modDashboard/components/ReportModal/ReportModal";
import { ReportsTable } from "@/features/dashboards/modDashboard/components/ReportsTable";
import { ReportsTableSkeleton } from "@/features/dashboards/modDashboard/components/ReportsTableSkeleton";
import { ReportStatsCards } from "@/features/dashboards/modDashboard/components/ReportStatsCards";
import { useModalState } from "@/features/dashboards/modDashboard/hooks/useModalState";
import { usePagination } from "@/features/dashboards/modDashboard/hooks/usePagination";
import { useReportManagement } from "@/features/dashboards/modDashboard/hooks/useReportManagement";
import { useReportReasonsQuery, useReportsQuery } from "@/queries/report.query";
import { useAuthStore } from "@/stores/auth.store";
import type { Report, ReportsQueryParams } from "@/zodSchemas/report.zod";

const ITEMS_PER_PAGE = 10;

const ModDashboard = () => {
  const [filters, setFilters] = useState<ReportsQueryParams>({});

  const { isGuest } = useAuthStore();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportData?.pagination]);

  const handleRetry = async () => {
    await refetchReports();
    await refetchReasons();
  };

  // Initial loading state
  const isInitialLoading =
    (reportLoading || reasonLoading) && !reportData && !reportReasons;

  // Show full page skeleton only on initial load
  if (isInitialLoading) {
    return <DashboardSkeleton />;
  }

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
    <main className="min-h-screen bg-background">
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
        {/* Guest User Notice */}
        {isGuest && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="text-amber-800 dark:text-amber-300 ml-2">
              <span className="font-semibold">Guest Mode – Demo Access:</span>{" "}
              You are viewing the reports dashboard as a guest for demonstration
              purposes. In a real environment, this section is restricted to
              moderators and administrators. All editing and administrative
              actions are disabled.
            </AlertDescription>
          </Alert>
        )}

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
        <div className="hidden md:block">
          {paginationProps && (
            <Pagination
              {...paginationProps}
              itemsPerPage={ITEMS_PER_PAGE}
              showResultsText
            />
          )}
        </div>
        <div className="md:hidden">
          {paginationProps && (
            <Pagination
              {...paginationProps}
              itemsPerPage={ITEMS_PER_PAGE}
              showResultsText={false}
            />
          )}
        </div>
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
    </main>
  );
};

export default ModDashboard;
