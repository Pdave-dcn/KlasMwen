import { useState, useCallback, useMemo } from "react";

interface PaginationMeta {
  page: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Hook for managing pagination state and navigation
 * Provides handlers for page changes with built-in boundary checks
 *
 * @param initialPage - Starting page number (default: 1)
 * @returns Pagination state and navigation handlers
 *
 * @example
 * const pagination = usePagination();
 *
 * // Use in query
 * const { data } = useQuery({ page: pagination.currentPage });
 *
 * // Update meta when data loads
 * useEffect(() => {
 *   if (data?.pagination) {
 *     pagination.setMeta(data.pagination);
 *   }
 * }, [data]);
 *
 * // Pass to Pagination component
 * <Pagination {...pagination.getProps()} />
 */
export const usePagination = (initialPage: number = 1) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  /**
   * Navigate to specific page
   * Validates page is within bounds
   */
  const goToPage = useCallback(
    (page: number) => {
      if (!meta) {
        setCurrentPage(page);
        return;
      }

      // Ensure page is within valid range
      if (page >= 1 && page <= meta.totalPages) {
        setCurrentPage(page);
      }
    },
    [meta]
  );

  /**
   * Navigate to next page
   * Only moves if hasNext is true
   */
  const goToNextPage = useCallback(() => {
    if (meta?.hasNext) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [meta?.hasNext]);

  /**
   * Navigate to previous page
   * Only moves if hasPrevious is true
   */
  const goToPreviousPage = useCallback(() => {
    if (meta?.hasPrevious) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [meta?.hasPrevious]);

  /**
   * Go to first page
   */
  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  /**
   * Go to last page
   */
  const goToLastPage = useCallback(() => {
    if (meta?.totalPages) {
      setCurrentPage(meta.totalPages);
    }
  }, [meta?.totalPages]);

  /**
   * Reset pagination to initial page
   * Useful when filters change
   */
  const reset = useCallback(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  /**
   * Check if on first page
   */
  const isFirstPage = useMemo(() => currentPage === 1, [currentPage]);

  /**
   * Check if on last page
   */
  const isLastPage = useMemo(
    () => (meta ? currentPage === meta.totalPages : false),
    [currentPage, meta]
  );

  /**
   * Check if pagination has multiple pages
   */
  const hasMultiplePages = useMemo(
    () => (meta ? meta.totalPages > 1 : false),
    [meta]
  );

  /**
   * Get props object to spread into Pagination component
   * Provides all necessary props for common pagination components
   */
  const getProps = useCallback(() => {
    if (!meta) return null;

    return {
      currentPage: meta.page,
      totalPages: meta.totalPages,
      totalItems: meta.total,
      hasNext: meta.hasNext,
      hasPrevious: meta.hasPrevious,
      onPageChange: goToPage,
      onNextPage: goToNextPage,
      onPreviousPage: goToPreviousPage,
    };
  }, [meta, goToPage, goToNextPage, goToPreviousPage]);

  return {
    // State
    currentPage,
    meta,

    // Setters
    setCurrentPage,
    setMeta,

    // Navigation
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    reset,

    // Computed
    isFirstPage,
    isLastPage,
    hasMultiplePages,

    // Helpers
    getProps,
  };
};
