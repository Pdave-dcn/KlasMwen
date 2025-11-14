import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UseReportsQueryParams } from "@/queries/report.query";
import type { ReportStatusEnum } from "@/zodSchemas/report.zod";

interface ReportFiltersProps {
  filters: UseReportsQueryParams;
  onFiltersChange: (filters: UseReportsQueryParams) => void;
}

const statusOptions: { value: any; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "dismissed", label: "Dismissed" },
];

const reasonOptions: { value: any; label: string }[] = [
  { value: "all", label: "All Reasons" },
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "misinformation", label: "Misinformation" },
  { value: "hate_speech", label: "Hate Speech" },
  { value: "violence", label: "Violence" },
  { value: "copyright", label: "Copyright" },
  { value: "other", label: "Other" },
];

export const ReportFilters = ({
  filters,
  onFiltersChange,
}: ReportFiltersProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="status" className="text-sm font-medium mb-2 block">
            Status
          </label>
          <Select
            value={filters.status ?? "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                status:
                  value === "all" ? undefined : (value as ReportStatusEnum),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="reason" className="text-sm font-medium mb-2 block">
            Reason
          </label>
          <Select
            value={filters.reason ?? "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                reason: value === "all" ? undefined : (value as any),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select reason" />
            </SelectTrigger>
            <SelectContent>
              {reasonOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* <div>
          <label className="text-sm font-medium mb-2 block">Date From</label>
          <Input
            type="date"
            value={filters.dateFrom || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, dateFrom: e.target.value })
            }
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Date To</label>
          <Input
            type="date"
            value={filters.dateTo || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, dateTo: e.target.value })
            }
          />
        </div> */}
      </div>
    </div>
  );
};
