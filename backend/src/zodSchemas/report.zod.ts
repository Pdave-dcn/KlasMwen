import { ReportStatus } from "@prisma/client";
import { z } from "zod";

const ResourceTypeEnum = z.enum(["post", "comment"]);

const ReportCreationDataSchema = z
  .object({
    reasonId: z.number().int().positive({
      message: "Reason ID must be a positive integer",
    }),
    postId: z.uuid().optional(),
    commentId: z.number().int().positive().optional(),
  })
  .refine(
    (data) => {
      const hasPostId = !!data.postId;
      const hasCommentId = !!data.commentId;

      return hasPostId !== hasCommentId;
    },
    {
      message: "Exactly one of postId or commentId must be provided",
      path: ["postId", "commentId"],
    }
  );

const ReportStatusUpdateSchema = z.object({
  status: z.enum(ReportStatus),
  moderatorNotes: z.string().optional(),
});

const ReportIdParamSchema = z.object({
  id: z
    .string("Report ID must be a string")
    .trim()
    .min(1, "Report ID cannot be empty")
    .regex(/^[0-9]+$/, "Report ID must contain only digits")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val), {
      message: "Report ID must be a valid number",
    })
    .refine((val) => val > 0, {
      message: "Report ID must be a positive number",
    })
    .refine((val) => Number.isSafeInteger(val), {
      message: "Report ID exceeds maximum safe integer",
    }),
});

const ToggleVisibilitySchema = z.object({
  resourceType: z.enum(["post", "comment"]),
  resourceId: z.union([z.string(), z.number()]),
  hidden: z.boolean(),
});

const ReportQuerySchema = z.object({
  status: z.enum(ReportStatus).optional(),
  reasonId: z
    .string()
    .regex(/^[0-9]+$/, "Reason ID must contain only digits")
    .transform((val) => parseInt(val, 10))
    .optional(),
  postId: z.uuid().optional(),
  commentId: z
    .string()
    .regex(/^[0-9]+$/, "Comment ID must contain only digits")
    .transform((val) => parseInt(val, 10))
    .optional(),
  page: z
    .string()
    .regex(/^[0-9]+$/, "Page must be a positive integer")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, { message: "Page must be greater than 0" })
    .default(1),
  limit: z
    .string()
    .regex(/^[0-9]+$/, "Limit must be a positive integer")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, {
      message: "Limit must be between 1 and 50",
    })
    .default(10),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  resourceType: ResourceTypeEnum.optional(),
});

type UpdateStatusData = z.infer<typeof ReportStatusUpdateSchema>;
type ReportQueryParams = z.infer<typeof ReportQuerySchema>;

export {
  ReportCreationDataSchema,
  ReportStatusUpdateSchema,
  ReportIdParamSchema,
  ToggleVisibilitySchema,
  ReportQuerySchema,
  type UpdateStatusData,
  type ReportQueryParams,
};
