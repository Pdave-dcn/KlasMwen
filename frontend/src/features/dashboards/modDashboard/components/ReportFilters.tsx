import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type UseReportsQueryParams } from "@/queries/report.query";
import type { Reason, ReportStatusEnum } from "@/zodSchemas/report.zod";

interface ReportFiltersProps {
  filters: UseReportsQueryParams;
  reportReasons: Reason[];
  onFiltersChange: (filters: UseReportsQueryParams) => void;
}

const statusOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "DISMISSED", label: "Dismissed" },
];

export const ReportFilters = ({
  filters,
  reportReasons,
  onFiltersChange,
}: ReportFiltersProps) => {
  const reasonOptions = [{ id: "all", label: "All Reasons" }, ...reportReasons];

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
            value={filters.reasonId ? String(filters.reasonId) : "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                reasonId: value === "all" ? undefined : Number(value),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select reason" />
            </SelectTrigger>
            <SelectContent>
              {reasonOptions.map((reason) => (
                <SelectItem key={reason.id} value={String(reason.id)}>
                  {reason.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Uncomment when date filters are needed
        <div>
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
