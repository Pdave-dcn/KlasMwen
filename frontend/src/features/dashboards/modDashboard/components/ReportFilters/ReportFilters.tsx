import { useEffect } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResourceIdSchema,
  type Reason,
  type ReportsQueryParams,
  type ReportStatusEnum,
  type ResourceIdFormData,
} from "@/zodSchemas/report.zod";

import {
  resourceTypeOptions,
  parseLocalDate,
  statusOptions,
  handleResourceTypeChange,
  handleResourceIdChange,
} from "../../helpers/reportFiltersHelpers";

import { DateFilter } from "./DateFilter";
import { SelectFilter } from "./SelectFilter";

interface ReportFiltersProps {
  filters: ReportsQueryParams;
  reportReasons: Reason[];
  onFiltersChange: (filters: ReportsQueryParams) => void;
}

/* eslint-disable-next-line complexity */
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

  // Form for resource ID validation
  const form = useForm<ResourceIdFormData>({
    resolver: zodResolver(ResourceIdSchema),
    mode: "onChange",
    defaultValues: {
      resourceType: filters.resourceType ?? "all",
      resourceId:
        filters.resourceType === "comment"
          ? String(filters.commentId ?? "")
          : filters.postId ?? "",
    },
  });

  const {
    register,
    setValue,
    formState: { errors },
    clearErrors,
  } = form;

  // Sync form with external filter changes
  useEffect(() => {
    setValue("resourceType", filters.resourceType ?? "all");
    setValue(
      "resourceId",
      filters.resourceType === "comment"
        ? String(filters.commentId ?? "")
        : filters.postId ?? ""
    );
  }, [filters.resourceType, filters.commentId, filters.postId, setValue]);

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
          onChange={(value) => {
            handleResourceTypeChange(form, onFiltersChange, filters, value);
          }}
        />

        {/* Resource ID Filter with Validation */}
        <div>
          <label
            htmlFor="resourceId"
            className="text-sm font-medium mb-2 block"
          >
            Resource ID
          </label>
          <Input
            {...register("resourceId")}
            id="resourceId"
            type="text"
            placeholder={
              filters.resourceType
                ? filters.resourceType === "post"
                  ? "e.g., 550e8400-e29b-41d4-a716-446655440000"
                  : "e.g., 123"
                : "Select resource type first"
            }
            disabled={!filters.resourceType}
            onChange={(e) =>
              handleResourceIdChange(
                form,
                onFiltersChange,
                filters,
                e.target.value
              )
            }
            className={errors.resourceId ? "border-destructive" : ""}
          />
          {errors.resourceId && (
            <p className="text-sm text-destructive mt-1">
              {errors.resourceId.message}
            </p>
          )}
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
        filters.dateTo ??
        filters.resourceType ??
        filters.postId ??
        filters.commentId) && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setValue("resourceType", "all");
              setValue("resourceId", "");
              clearErrors("resourceId");
              onFiltersChange({
                status: undefined,
                reasonId: undefined,
                dateFrom: undefined,
                dateTo: undefined,
                resourceType: undefined,
                postId: undefined,
                commentId: undefined,
              });
            }}
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
};
