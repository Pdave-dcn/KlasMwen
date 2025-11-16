/**
 * Generates array of page numbers to display with ellipsis
 * Shows: first page, last page, current page, and pages around current
 */
export const generatePageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | "ellipsis")[] => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];
  const showEllipsis = totalPages > maxVisible;

  // Always show first page
  pages.push(1);

  // Calculate range around current page
  let startPage = Math.max(2, currentPage - 1);
  let endPage = Math.min(totalPages - 1, currentPage + 1);

  // Adjust if near start
  if (currentPage <= 3) {
    endPage = Math.min(maxVisible - 1, totalPages - 1);
  }

  // Adjust if near end
  if (currentPage >= totalPages - 2) {
    startPage = Math.max(2, totalPages - (maxVisible - 2));
  }

  // Add ellipsis after first page if needed
  if (startPage > 2 && showEllipsis) {
    pages.push("ellipsis");
  }

  // Add middle pages
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  // Add ellipsis before last page if needed
  if (endPage < totalPages - 1 && showEllipsis) {
    pages.push("ellipsis");
  }

  // Always show last page (if not already included)
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
};
