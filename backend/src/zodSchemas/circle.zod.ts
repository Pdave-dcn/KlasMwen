import { CircleRole } from "@prisma/client";
import { z } from "zod";

const StudyCircleIdParamSchema = z.object({
  circleId: z.uuid("Invalid study circle ID format"),
});

const UserIdParamSchema = z.object({
  userId: z.uuid("Invalid user ID format"),
});

// Circle Schemas

const CreatorIdParamSchema = z.object({
  creatorId: z.uuid("Invalid creator ID format"),
});

const CreateStudyCircleDataSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Study Circle name is required")
    .max(100, "Study Circle name must not exceed 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  isPrivate: z.boolean().default(false),
  creatorId: z.uuid("Invalid creator ID"),
  tagIds: z.array(z.number().int().positive()).optional().default([]),
});

const UpdateStudyCircleDataSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Study Circle name is required")
      .max(100, "Study Circle name must not exceed 100 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .max(500, "Description must not exceed 500 characters")
      .optional(),
    isPrivate: z.boolean().optional(),
    avatarId: z.number().int().positive(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// Circle Member Schemas

const AddMemberDataSchema = z.object({
  userId: z.uuid("Invalid user ID"),
  role: z.enum(CircleRole).optional().default("MEMBER"),
});

const UpdateMemberRoleDataSchema = z.object({
  role: z.enum(CircleRole),
});

// Circle Message Schemas

const SendMessageDataSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message content is required")
    .max(1000, "Message must not exceed 1000 characters"),
});

const MessageIdParamSchema = z.object({
  id: z
    .string("Message ID must be a string")
    .trim()
    .min(1, "Message ID cannot be empty")
    .regex(/^[0-9]+$/, "Message ID must contain only digits")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val), {
      message: "Message ID must be a valid number",
    })
    .refine((val) => val > 0, {
      message: "Message ID must be a positive number",
    })
    .refine((val) => Number.isSafeInteger(val), {
      message: "Message ID exceeds maximum safe integer",
    }),
});

// Search Schemas

const CircleSearchFiltersSchema = z.object({
  query: z.string().trim().optional(),
  isPrivate: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  excludeJoined: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  creatorId: z.uuid().optional(),
  minMembers: z
    .string()
    .transform((val) => parseInt(val))
    .optional(),
  maxMembers: z
    .string()
    .transform((val) => parseInt(val))
    .optional(),
  tagIds: z
    .union([
      z.string(), // Handle comma-separated string
      z.array(z.string()), // Handle array of strings from query params
    ])
    .transform((val) => {
      // Handle array of strings
      if (Array.isArray(val)) {
        return val
          .map((id) => parseInt(id, 10))
          .filter((id) => !isNaN(id) && id > 0);
      }

      // Handle comma-separated string
      if (!val || val.trim() === "") {
        return [];
      }

      return val
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id) && id > 0);
    })
    .pipe(z.array(z.number().int().positive()).max(10))
    .default([]),
});

const TrendingQuerySchema = z.object({
  timeframe: z.coerce.number().min(1).max(30).optional().default(7),
});

const SmallCirclesQuerySchema = z.object({
  maxMembers: z.coerce.number().min(2).max(50).optional().default(10),
});

const SearchSuggestionQuerySchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(20).optional().default(10),
});

type CreateStudyCircleData = z.infer<typeof CreateStudyCircleDataSchema>;
type UpdateStudyCircleData = z.infer<typeof UpdateStudyCircleDataSchema>;
type AddMemberData = z.infer<typeof AddMemberDataSchema>;
type UpdateMemberRoleData = z.infer<typeof UpdateMemberRoleDataSchema>;
type SendMessageData = z.infer<typeof SendMessageDataSchema>;

export {
  CreateStudyCircleDataSchema,
  UpdateStudyCircleDataSchema,
  CircleSearchFiltersSchema,
  StudyCircleIdParamSchema,
  CreatorIdParamSchema,
  UserIdParamSchema,
  AddMemberDataSchema,
  UpdateMemberRoleDataSchema,
  SendMessageDataSchema,
  MessageIdParamSchema,
  TrendingQuerySchema,
  SmallCirclesQuerySchema,
  SearchSuggestionQuerySchema,
  type CreateStudyCircleData,
  type UpdateStudyCircleData,
  type AddMemberData,
  type UpdateMemberRoleData,
  type SendMessageData,
};
