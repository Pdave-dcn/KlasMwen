import { ReportStatus } from "@prisma/client";
import { z } from "zod";

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
  status: z.enum(Object.values(ReportStatus)),
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

type UpdateStatusData = z.infer<typeof ReportStatusUpdateSchema>;

export {
  ReportCreationDataSchema,
  ReportStatusUpdateSchema,
  ReportIdParamSchema,
  ToggleVisibilitySchema,
  type UpdateStatusData,
};
