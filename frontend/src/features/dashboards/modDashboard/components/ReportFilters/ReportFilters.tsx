import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  Reason,
  ReportsQueryParams,
  ReportStatusEnum,
} from "@/zodSchemas/report.zod";

import {
  resourceTypeOptions,
  parseLocalDate,
  statusOptions,
} from "../../helpers/reportFiltersHelpers";

import { DateFilter } from "./DateFilter";
import { SelectFilter } from "./SelectFilter";

interface ReportFiltersProps {
  filters: ReportsQueryParams;
  reportReasons: Reason[];
  onFiltersChange: (filters: ReportsQueryParams) => void;
}

export const ReportFilters = ({
  filters,
  reportReasons,
  onFiltersChange,
}: ReportFiltersProps) => {
  const dateFrom = filters.dateFrom
    ? parseLocalDate(filters.dateFrom)
    : undefined;
  const dateTo = filters.dateTo ? parseLocalDate(filters.dateTo) : undefined;

  const reasonOptions = [
    { value: "all", label: "All Reasons" },
    ...reportReasons.map((r) => ({ value: String(r.id), label: r.label })),
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SelectFilter
          label="Status"
          value={filters.status ?? "all"}
          options={statusOptions}
          onChange={(value) =>
            onFiltersChange({
              ...filters,
              status: value === "all" ? undefined : (value as ReportStatusEnum),
            })
          }
        />

        <SelectFilter
          label="Reason"
          value={filters.reasonId ? String(filters.reasonId) : "all"}
          options={reasonOptions}
          onChange={(value) =>
            onFiltersChange({
              ...filters,
              reasonId: value === "all" ? undefined : Number(value),
            })
          }
        />

        {/* Content Type Filter */}
        <SelectFilter
          label="Resource Type"
          value={filters.resourceType ?? "all"}
          options={resourceTypeOptions}
          onChange={(value) =>
            onFiltersChange({
              ...filters,
              resourceType:
                value === "all" ? undefined : (value as "post" | "comment"),
            })
          }
        />

        {/* Resource ID Filter */}
        <div>
          <label
            htmlFor="resourceId"
            className="text-sm font-medium mb-2 block"
          >
            Resource ID
          </label>

          <Input
            id="resourceId"
            type="text"
            className="w-full border rounded-md px-3 py-2"
            placeholder={
              filters.resourceType
                ? "Enter resource ID…"
                : "Select resource type first"
            }
            value={
              filters.resourceType === "comment"
                ? filters.commentId ?? ""
                : filters.resourceType === "post"
                ? filters.postId ?? ""
                : ""
            }
            disabled={!filters.resourceType}
            onChange={(e) => {
              const value = e.target.value || undefined;

              if (filters.resourceType === "comment") {
                onFiltersChange({
                  ...filters,
                  commentId: Number(value),
                  postId: undefined,
                });
              } else if (filters.resourceType === "post") {
                onFiltersChange({
                  ...filters,
                  postId: value,
                  commentId: undefined,
                });
              }
            }}
          />
        </div>

        <DateFilter
          label="Date From"
          date={dateFrom}
          onChange={(date) =>
            onFiltersChange({
              ...filters,
              dateFrom: date ? format(date, "yyyy-MM-dd") : undefined,
            })
          }
          disabled={(d) => (dateTo ? d > dateTo : d > new Date())}
        />

        <DateFilter
          label="Date To"
          date={dateTo}
          onChange={(date) =>
            onFiltersChange({
              ...filters,
              dateTo: date ? format(date, "yyyy-MM-dd") : undefined,
            })
          }
          disabled={(d) =>
            dateFrom ? d < dateFrom || d > new Date() : d > new Date()
          }
        />
      </div>

      {(filters.status ??
        filters.reasonId ??
        filters.dateFrom ??
        filters.dateTo) && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onFiltersChange({
                status: undefined,
                reasonId: undefined,
                dateFrom: undefined,
                dateTo: undefined,
              })
            }
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
};
