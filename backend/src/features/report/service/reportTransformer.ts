/**
 * Helper class for report-related data transformations.
 */
class ReportTransFormer {
  /**
   * Converts a `"YYYY-MM-DD"` string into a `Date` object using **local time**
   * to avoid timezone shifts caused by `new Date("YYYY-MM-DD")`.
   *
   * @param str - Date string in `"YYYY-MM-DD"` format.
   * @returns A `Date` representing the same calendar day in local time.
   */
  static parseLocalDate(str: string): Date {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
}

export default ReportTransFormer;
