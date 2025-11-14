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

const ReportedPostSchema = z.object({
  id: z.uuid(),
  title: z.string(),
});

const ReportedCommentSchema = z.object({
  id: z.number().int(),
  content: z.string(),
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

// Type exports
export type ReportStatusEnum = z.infer<typeof ReportStatusEnum>;
export type ReportContentTypeEnum = z.infer<typeof ReportContentTypeEnum>;
export type Reporter = z.infer<typeof ReporterSchema>;
export type Reason = z.infer<typeof ReasonSchema>;
export type Report = z.infer<typeof ReportSchema>;
export type ReportsResponse = z.infer<typeof ReportsResponseSchema>;
export type ActiveReasonsResponse = z.infer<typeof ActiveReasonsResponseSchema>;

export type CreateReportRequest = z.infer<typeof CreateReportRequestSchema>;
export type UpdateReportStatusRequest = z.infer<
  typeof UpdateReportStatusRequestSchema
>;
export type ToggleVisibilityRequest = z.infer<
  typeof ToggleVisibilityRequestSchema
>;

// Schema exports
export {
  ReasonSchema,
  ReportSchema,
  ReportsResponseSchema,
  UpdatedReportResponseSchema,
  ActiveReasonsResponseSchema,
  CreateReportRequestSchema,
  UpdateReportStatusRequestSchema,
  ToggleVisibilityRequestSchema,
};
