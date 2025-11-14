import { useState } from "react";

import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  EyeOff,
} from "lucide-react";

import { Pagination } from "@/components/dashboard/Pagination";
import { ReportFilters as ReportFiltersComponent } from "@/components/dashboard/ReportFilters";
import { ReportModal } from "@/components/dashboard/ReportModal";
import { ReportsTable } from "@/components/dashboard/ReportsTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { Spinner } from "@/components/ui/spinner";
import {
  useReportsQuery,
  type UseReportsQueryParams,
} from "@/queries/report.query";
import type { Report, ReportStatusEnum } from "@/zodSchemas/report.zod";

const ITEMS_PER_PAGE = 10;

const ModDashboard = () => {
  const [filters, setFilters] = useState<UseReportsQueryParams>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, error } = useReportsQuery({
    ...filters,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  });

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-red-500 font-bold text-2xl">
        <h1>Something went wrong</h1>
      </div>
    );
  }

  const reports = data?.data ?? [];
  const pagination = data?.pagination;

  // Handlers
  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleToggleHidden = (reportId: number) => {
    console.log(reportId);
  };

  const handleMarkReviewed = (reportId: number) => {
    console.log(reportId);
  };

  const handleDismiss = (reportId: number) => {
    console.log(reportId);
  };

  const handleUpdateStatus = (reportId: number, status: ReportStatusEnum) => {
    console.log(reportId, status);
  };

  const handleUpdateNotes = (reportId: number, notes: string) => {
    console.log(reportId, notes);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            Manage and review user reports for your educational platform
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            title="Total Reports"
            value={100}
            icon={FileText}
            variant="default"
          />
          <StatCard
            title="Pending"
            value={20}
            icon={AlertTriangle}
            variant="pending"
          />
          <StatCard
            title="Reviewed"
            value={40}
            icon={CheckCircle}
            variant="reviewed"
          />
          <StatCard
            title="Dismissed"
            value={25}
            icon={XCircle}
            variant="dismissed"
          />
          <StatCard
            title="Hidden Content"
            value={15}
            icon={EyeOff}
            variant="default"
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <ReportFiltersComponent
            filters={filters}
            onFiltersChange={(newFilters) => {
              setFilters(newFilters);
              setCurrentPage(1); // Reset to page 1 when filters change
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
