import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  Reason,
  ReportsQueryParams,
  ReportStatusEnum,
} from "@/zodSchemas/report.zod";

import { parseLocalDate, statusOptions } from "../helpers/reportFiltersHelpers";

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
  const reasonOptions = [{ id: "all", label: "All Reasons" }, ...reportReasons];

  // Parse dates without timezone shift
  const dateFrom = filters.dateFrom
    ? parseLocalDate(filters.dateFrom)
    : undefined;
  const dateTo = filters.dateTo ? parseLocalDate(filters.dateTo) : undefined;

  const handleDateFromChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateFrom: date ? format(date, "yyyy-MM-dd") : undefined,
    });
  };

  const handleDateToChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateTo: date ? format(date, "yyyy-MM-dd") : undefined,
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
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

        {/* Reason Filter */}
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

        {/* Date From Filter */}
        <div>
          <label htmlFor="dateFrom" className="text-sm font-medium mb-2 block">
            Date From
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={handleDateFromChange}
                disabled={(date) =>
                  dateTo ? date > dateTo : date > new Date()
                }
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To Filter */}
        <div>
          <label htmlFor="dateTo" className="text-sm font-medium mb-2 block">
            Date To
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={handleDateToChange}
                disabled={(date) =>
                  dateFrom
                    ? date < dateFrom || date > new Date()
                    : date > new Date()
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Clear Filters Button */}
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
