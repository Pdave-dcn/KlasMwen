import { useState } from "react";

import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Pagination } from "@/components/dashboard/Pagination";
import { ReportFilters as ReportFiltersComponent } from "@/components/dashboard/ReportFilters";
import { ReportModal } from "@/components/dashboard/ReportModal";
import { ReportsTable } from "@/components/dashboard/ReportsTable";
import { ReportStatsCards } from "@/components/dashboard/ReportStatsCards";
import {
  useReportReasonsQuery,
  useReportsQuery,
  useToggleVisibilityMutation,
  useMarkReviewedMutation,
  useDismissReportMutation,
  useUpdateReportStatusMutation,
  type UseReportsQueryParams,
} from "@/queries/report.query";
import type { Report, ReportStatusEnum } from "@/zodSchemas/report.zod";

const ITEMS_PER_PAGE = 10;

const ModDashboard = () => {
  const [filters, setFilters] = useState<UseReportsQueryParams>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: reportData,
    isLoading: reportLoading,
    error: reportError,
  } = useReportsQuery({
    ...filters,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  });

  const {
    data: reportReasons,
    isLoading: reasonLoading,
    error: reasonError,
  } = useReportReasonsQuery();

  // Mutations
  const toggleVisibilityMutation = useToggleVisibilityMutation();
  const markReviewedMutation = useMarkReviewedMutation();
  const dismissReportMutation = useDismissReportMutation();
  const updateStatusMutation = useUpdateReportStatusMutation();

  if (reportLoading || reasonLoading) {
    return <DashboardSkeleton />;
  }

  if (reportError || reasonError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-red-500 font-bold text-2xl">
        <h1>Something went wrong</h1>
      </div>
    );
  }

  const reports = reportData?.data ?? [];
  const pagination = reportData?.pagination;

  // Handlers
  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleToggleHidden = (reportId: number) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    const resourceType = report.contentType;
    const resourceId =
      resourceType === "post" ? report.post?.id : report.comment?.id;

    if (!resourceId) {
      console.error("Resource ID not found");
      return;
    }

    toggleVisibilityMutation.mutate({
      resourceType,
      resourceId,
      hidden: !report.isContentHidden,
    });
  };

  const handleMarkReviewed = (reportId: number) => {
    markReviewedMutation.mutate(reportId);
  };

  const handleDismiss = (reportId: number) => {
    dismissReportMutation.mutate(reportId);
  };

  const handleUpdateStatus = (
    reportId: number,
    status: ReportStatusEnum,
    notes?: string
  ) => {
    updateStatusMutation.mutate({
      id: reportId,
      data: {
        status,
        moderatorNotes: notes,
      },
    });
  };

  const handleUpdateNotes = (reportId: number, notes: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    updateStatusMutation.mutate({
      id: reportId,
      data: {
        status: report.status,
        moderatorNotes: notes,
      },
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    if (pagination?.hasNext) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pagination?.hasPrevious) {
      setCurrentPage((prev) => prev - 1);
    }
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
            onFiltersChange={(newFilters) => {
              setFilters(newFilters);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Reports Table */}
        <div className="mb-6">
          <ReportsTable
            reports={reports}
            onViewDetails={handleViewDetails}
            onToggleHidden={handleToggleHidden}
            onMarkReviewed={handleMarkReviewed}
            onDismiss={handleDismiss}
            isTogglingVisibility={toggleVisibilityMutation.isPending}
            isUpdatingStatus={
              markReviewedMutation.isPending ||
              dismissReportMutation.isPending ||
              updateStatusMutation.isPending
            }
          />
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={pagination.total}
          />
        )}
      </div>

      {/* Report Detail Modal */}
      <ReportModal
        report={selectedReport}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        onToggleHidden={handleToggleHidden}
        onUpdateNotes={handleUpdateNotes}
      />
    </div>
  );
};

export default ModDashboard;
