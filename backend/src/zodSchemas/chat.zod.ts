import { ChatRole } from "@prisma/client";
import { z } from "zod";

const ChatGroupIdParamSchema = z.object({
  chatGroupId: z.uuid("Invalid chat group ID format"),
});

const UserIdParamSchema = z.object({
  userId: z.uuid("Invalid user ID format"),
});

// Chat Group Schemas

const CreatorIdParamSchema = z.object({
  creatorId: z.uuid("Invalid creator ID format"),
});

const CreateChatGroupDataSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Group name is required")
    .max(100, "Group name must not exceed 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  isPrivate: z.boolean().default(false),
  creatorId: z.uuid("Invalid creator ID"),
});

const UpdateChatGroupDataSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Group name is required")
      .max(100, "Group name must not exceed 100 characters")
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

// Chat Member Schemas

const AddMemberDataSchema = z.object({
  userId: z.uuid("Invalid user ID"),
  role: z.enum(ChatRole).optional().default("MEMBER"),
});

const UpdateMemberRoleDataSchema = z.object({
  role: z.enum(ChatRole),
});

// Chat Message Schemas

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

const GroupSearchFiltersSchema = z.object({
  query: z.string().optional(),
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
});

const TrendingQuerySchema = z.object({
  timeframe: z.coerce.number().min(1).max(30).optional().default(7),
});

const SmallGroupsQuerySchema = z.object({
  maxMembers: z.coerce.number().min(2).max(50).optional().default(10),
});

const SearchSuggestionQuerySchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(20).optional().default(10),
});

type CreateChatGroupData = z.infer<typeof CreateChatGroupDataSchema>;
type UpdateChatGroupData = z.infer<typeof UpdateChatGroupDataSchema>;
type AddMemberData = z.infer<typeof AddMemberDataSchema>;
type UpdateMemberRoleData = z.infer<typeof UpdateMemberRoleDataSchema>;
type SendMessageData = z.infer<typeof SendMessageDataSchema>;

export {
  CreateChatGroupDataSchema,
  UpdateChatGroupDataSchema,
  GroupSearchFiltersSchema,
  ChatGroupIdParamSchema,
  CreatorIdParamSchema,
  UserIdParamSchema,
  AddMemberDataSchema,
  UpdateMemberRoleDataSchema,
  SendMessageDataSchema,
  MessageIdParamSchema,
  TrendingQuerySchema,
  SmallGroupsQuerySchema,
  SearchSuggestionQuerySchema,
  type CreateChatGroupData,
  type UpdateChatGroupData,
  type AddMemberData,
  type UpdateMemberRoleData,
  type SendMessageData,
};
