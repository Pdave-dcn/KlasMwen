import { useMemo } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import { generatePageNumbers } from "../helpers/generatePageNumbers";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  itemsPerPage: number;
  totalItems: number;
  // Optional props for customization
  maxVisiblePages?: number;
  showResultsText?: boolean;
  className?: string;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  onNextPage,
  onPreviousPage,
  itemsPerPage,
  totalItems,
  maxVisiblePages = 5,
  showResultsText = true,
  className = "",
}: PaginationProps) => {
  // Calculate item range
  const startItem = useMemo(
    () => (currentPage - 1) * itemsPerPage + 1,
    [currentPage, itemsPerPage]
  );

  const endItem = useMemo(
    () => Math.min(currentPage * itemsPerPage, totalItems),
    [currentPage, itemsPerPage, totalItems]
  );

  // Generate page numbers with ellipsis
  const pageNumbers = useMemo(
    () => generatePageNumbers(currentPage, totalPages, maxVisiblePages),
    [currentPage, totalPages, maxVisiblePages]
  );

  // Disabled states
  const isPreviousDisabled = currentPage === 1;
  const isNextDisabled = currentPage === totalPages;

  return (
    <div
      className={`flex items-center justify-between bg-card border border-border rounded-lg px-6 py-4 ${className}`}
      data-testid="pagination"
    >
      {/* Results text */}
      {showResultsText && (
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{startItem}</span> to{" "}
          <span className="font-medium">{endItem}</span> of{" "}
          <span className="font-medium">{totalItems}</span> results
        </div>
      )}

      {/* Pagination controls */}
      <div
        className={`flex items-center gap-2 ${
          showResultsText ? "" : "ml-auto"
        }`}
      >
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={isPreviousDisabled}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {/* Page numbers */}
        <div
          className="hidden md:flex gap-1"
          role="navigation"
          aria-label="Pagination"
        >
          {pageNumbers.map((page, index) => {
            if (page === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${index + 1}`}
                  className="px-2 flex items-center text-muted-foreground"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            const isCurrentPage = page === currentPage;

            return (
              <Button
                key={page}
                variant={isCurrentPage ? "default" : "outline"}
                size="sm"
                className="w-10"
                onClick={() => onPageChange(page)}
                disabled={isCurrentPage}
                aria-label={`Go to page ${page}`}
                aria-current={isCurrentPage ? "page" : undefined}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={isNextDisabled}
          aria-label="Go to next page"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
