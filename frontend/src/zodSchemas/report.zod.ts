import { z } from "zod";

import { RoleSchema } from "./user.zod";

const ReportStatusEnum = z.enum(["PENDING", "REVIEWED", "DISMISSED"]);
const ResourceTypeEnum = z.enum(["post", "comment"]);
const ReportContentTypeEnum = ResourceTypeEnum;

const ReporterSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  email: z.email(),
  role: RoleSchema,
});

const ReportedResourceAuthorSchema = z.object({
  id: z.uuid(),
  username: z.string(),
});

const ReportedPostSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  author: ReportedResourceAuthorSchema,
});

const ReportedCommentSchema = z.object({
  id: z.number().int(),
  content: z.string(),
  author: ReportedResourceAuthorSchema,
});

const ReasonSchema = z.object({
  id: z.number().int(),
  label: z.string(),
  description: z.string().nullish(),
});

const ReportSchema = z.object({
  id: z.number().int(),
  status: ReportStatusEnum,
  contentType: ReportContentTypeEnum,
  isContentHidden: z.boolean(),
  moderatorNotes: z.string().nullish(),
  createdAt: z.string(),
  reporter: ReporterSchema,
  reason: ReasonSchema,
  post: ReportedPostSchema.nullish(),
  comment: ReportedCommentSchema.nullish(),
});

const ReportsPaginationMetadataSchema = z.object({
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
});

const ReportsResponseSchema = z.object({
  data: z.array(ReportSchema),
  pagination: ReportsPaginationMetadataSchema,
});

const ActiveReasonsResponseSchema = z.object({
  data: z.array(ReasonSchema),
});

const UpdatedReportResponseSchema = z.object({
  message: z.string(),
  data: ReportSchema,
});

// Report Statistics Schema
const ReportStatsSchema = z.object({
  totalReports: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  reviewed: z.number().int().nonnegative(),
  dismissed: z.number().int().nonnegative(),
  hiddenContent: z.number().int().nonnegative(),
});

const ReportStatsResponseSchema = z.object({
  data: ReportStatsSchema,
});

// Request Schemas
const CreateReportRequestSchema = z.object({
  reporterId: z.uuid(),
  reasonId: z.number().int(),
  commentId: z.number().int().nullish(),
  postId: z.uuid().nullish(),
});

const UpdateReportStatusRequestSchema = z.object({
  status: ReportStatusEnum,
  moderatorNotes: z.string().nullish(),
});

const ToggleVisibilityRequestSchema = z.object({
  resourceType: ResourceTypeEnum,
  resourceId: z.union([z.uuid(), z.number().int()]),
  hidden: z.boolean(),
});

const ReportsQueryParamsSchema = z
  .object({
    status: ReportStatusEnum.optional(),
    postId: z.string().optional(),
    commentId: z.number().int().optional(),
    reasonId: z.number().int().optional(),
    resourceType: ResourceTypeEnum.optional(),
    page: z.number().int().optional(),
    limit: z.number().int().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  })
  .refine(
    (data) => {
      // If both dates are provided, dateFrom should be before or equal to dateTo
      if (data.dateFrom && data.dateTo) {
        return new Date(data.dateFrom) <= new Date(data.dateTo);
      }
      return true;
    },
    {
      message: "dateFrom must be before or equal to dateTo",
      path: ["dateFrom"],
    }
  );

const ResourceIdSchema = z
  .object({
    resourceType: z.enum(["post", "comment", "all"]).optional(),
    resourceId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.resourceType || data.resourceType === "all" || !data.resourceId) {
      return;
    }

    if (data.resourceType === "post") {
      // Validate UUID format for posts
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(data.resourceId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Post ID must be a valid UUID format",
          path: ["resourceId"],
        });
      }
    } else if (data.resourceType === "comment") {
      // Validate number format for comments
      const commentId = Number(data.resourceId);
      if (isNaN(commentId) || !Number.isInteger(commentId) || commentId <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Comment ID must be a positive integer",
          path: ["resourceId"],
        });
      }
    }
  });

// Type exports
export type ReportStatusEnum = z.infer<typeof ReportStatusEnum>;
export type ReportContentTypeEnum = z.infer<typeof ReportContentTypeEnum>;
export type Reporter = z.infer<typeof ReporterSchema>;
export type Reason = z.infer<typeof ReasonSchema>;
export type Report = z.infer<typeof ReportSchema>;
export type ReportsResponse = z.infer<typeof ReportsResponseSchema>;
export type ActiveReasonsResponse = z.infer<typeof ActiveReasonsResponseSchema>;
export type ReportStats = z.infer<typeof ReportStatsSchema>;
export type ReportStatsResponse = z.infer<typeof ReportStatsResponseSchema>;

export type CreateReportRequest = z.infer<typeof CreateReportRequestSchema>;
export type UpdateReportStatusRequest = z.infer<
  typeof UpdateReportStatusRequestSchema
>;
export type ToggleVisibilityRequest = z.infer<
  typeof ToggleVisibilityRequestSchema
>;
export type ReportsQueryParams = z.infer<typeof ReportsQueryParamsSchema>;

export type ResourceIdFormData = z.infer<typeof ResourceIdSchema>;

// Schema exports
export {
  ReasonSchema,
  ReportSchema,
  ReportsResponseSchema,
  UpdatedReportResponseSchema,
  ActiveReasonsResponseSchema,
  ReportStatsSchema,
  ReportStatsResponseSchema,
  CreateReportRequestSchema,
  UpdateReportStatusRequestSchema,
  ToggleVisibilityRequestSchema,
  ReportsQueryParamsSchema,
  ResourceIdSchema,
};
