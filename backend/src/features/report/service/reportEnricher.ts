import type { Report, EnrichedReport, ReportContentType } from "./reportTypes";

class ReportEnricher {
  /**
   * Determines the content type of a report
   * @param report - Report to check
   * @returns The content type ("post" or "comment")
   */
  private static getContentType(report: Report): ReportContentType {
    return report.comment?.id ? "comment" : "post";
  }

  /**
   * Removes the hidden field from post and comment objects
   * @param report - Report to sanitize
   * @returns Report without hidden fields in nested objects
   */
  private static sanitizeReport(
    report: Report & {
      isContentHidden: boolean;
      contentType: ReportContentType;
    }
  ) {
    const sanitized = { ...report };

    if (sanitized.post) {
      const { hidden: _hidden, ...postWithoutHidden } = sanitized.post;
      sanitized.post = postWithoutHidden as typeof sanitized.post;
    }

    if (sanitized.comment) {
      const { hidden: _hidden, ...commentWithoutHidden } = sanitized.comment;
      sanitized.comment = commentWithoutHidden as typeof sanitized.comment;
    }

    return sanitized;
  }

  /**
   * Enriches reports with hidden state information
   * @param reports - Array of reports to enrich
   * @returns Reports with isContentHidden field
   */
  static enrichReportsWithHiddenState(reports: Report[]) {
    return reports.map((report) => ({
      ...report,
      isContentHidden: report.comment?.hidden ?? report.post?.hidden ?? false,
    }));
  }

  /**
   * Enriches reports with content type information
   * @param reports - Array of reports to enrich
   * @returns Reports with contentType field
   */
  static enrichReportsWithContentType(reports: Report[]) {
    return reports.map((report) => ({
      ...report,
      contentType: this.getContentType(report),
    }));
  }

  /**
   * Enriches reports with all additional fields (hidden state + content type)
   * and removes redundant hidden fields from nested objects
   * @param reports - Array of reports to enrich
   * @returns Fully enriched and sanitized reports
   */
  static enrichReports(reports: Report[]): EnrichedReport[] {
    return reports.map((report) => {
      const enriched = {
        ...report,
        isContentHidden: report.comment?.hidden ?? report.post?.hidden ?? false,
        contentType: this.getContentType(report),
      };

      return this.sanitizeReport(enriched);
    });
  }

  /**
   * Enriches a single report with all additional fields
   * and removes redundant hidden fields from nested objects
   * @param report - Single report to enrich
   * @returns Fully enriched and sanitized report
   */
  static enrichReport(report: Report): EnrichedReport {
    const enriched = {
      ...report,
      isContentHidden: report.comment?.hidden ?? report.post?.hidden ?? false,
      contentType: this.getContentType(report),
    };

    return this.sanitizeReport(enriched);
  }
}

export default ReportEnricher;
