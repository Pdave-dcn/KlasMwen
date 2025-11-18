import { type UseFormReturn } from "react-hook-form";

import {
  ResourceIdSchema,
  type ReportsQueryParams,
  type ResourceIdFormData,
} from "@/zodSchemas/report.zod";

const statusOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "DISMISSED", label: "Dismissed" },
];

const resourceTypeOptions = [
  { value: "all", label: "All Resource Types" },
  { value: "post", label: "Post" },
  { value: "comment", label: "Comment" },
];

// Prevent timezone shifting by constructing a local date
const parseLocalDate = (str: string) => {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const handleResourceTypeChange = (
  form: UseFormReturn<ResourceIdFormData>,
  onFiltersChange: (filters: ReportsQueryParams) => void,
  filters: ReportsQueryParams,
  value: string
) => {
  const resourceType =
    value === "all" ? undefined : (value as "post" | "comment");

  form.setValue("resourceType", value as "post" | "comment" | "all");
  form.setValue("resourceId", "");

  onFiltersChange({
    ...filters,
    resourceType,
    postId: undefined,
    commentId: undefined,
  });
};

const handleResourceIdChange = async (
  form: UseFormReturn<ResourceIdFormData>,
  onFiltersChange: (filters: ReportsQueryParams) => void,
  filters: ReportsQueryParams,
  value: string
) => {
  form.setValue("resourceId", value);

  // Trigger validation
  await form.trigger("resourceId");

  // Only update filters if validation passes
  const result = ResourceIdSchema.safeParse({
    resourceType: filters.resourceType,
    resourceId: value,
  });

  if (result.success && value) {
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
  } else if (!value) {
    // Clear the filter if empty
    onFiltersChange({
      ...filters,
      commentId: undefined,
      postId: undefined,
    });
  }
};

export {
  statusOptions,
  resourceTypeOptions,
  parseLocalDate,
  handleResourceIdChange,
  handleResourceTypeChange,
};
