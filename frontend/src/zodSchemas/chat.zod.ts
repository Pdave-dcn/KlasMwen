import { z } from "zod";

// Base Schemas

const ChatRoleSchema = z.enum(["OWNER", "MODERATOR", "MEMBER"]);

const UserBasicSchema = z.object({
  id: z.string(),
  username: z.string(),
});

const ChatGroupCreatorSchema = UserBasicSchema;

// Chat Group Schemas

const ChatGroupDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isPrivate: z.boolean(),
  createdAt: z.string(),
  creator: ChatGroupCreatorSchema,
  memberCount: z.number().int(),
  userRole: ChatRoleSchema.nullable(),
});

const ChatGroupsResponseSchema = z.object({
  data: z.array(ChatGroupDataSchema),
});

const ChatGroupResponseSchema = z.object({
  data: ChatGroupDataSchema,
});

// Chat Member Schemas

const ChatMemberDataSchema = z.object({
  userId: z.string(),
  role: ChatRoleSchema,
  joinedAt: z.string(),
  mutedUntil: z.string().nullable(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
  }),
});

const ChatMembersResponseSchema = z.object({
  data: z.array(ChatMemberDataSchema),
});

const ChatMemberResponseSchema = z.object({
  data: ChatMemberDataSchema,
});

// Chat Message Schemas

const ChatMessageDataSchema = z.object({
  id: z.number().int(),
  content: z.string(),
  createdAt: z.string(),
  sender: UserBasicSchema,
});

const ChatMessagesResponseSchema = z.object({
  data: z.array(ChatMessageDataSchema),
  pagination: z.object({
    nextCursor: z.number().int().nullable(),
    hasMore: z.boolean(),
  }),
});

const ChatMessageResponseSchema = z.object({
  data: ChatMessageDataSchema,
});

// Request Schemas

const CreateChatGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().optional(),
});

const UpdateChatGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullish(),
  isPrivate: z.boolean().optional(),
});

const AddMemberSchema = z.object({
  userId: z.string(),
  role: ChatRoleSchema.optional(),
});

const UpdateMemberRoleSchema = z.object({
  role: ChatRoleSchema,
});

const SendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
});

export type ChatRole = z.infer<typeof ChatRoleSchema>;
export type ChatGroup = z.infer<typeof ChatGroupDataSchema>;
export type ChatMember = z.infer<typeof ChatMemberDataSchema>;
export type ChatMessage = z.infer<typeof ChatMessageDataSchema>;

export type CreateChatGroupData = z.infer<typeof CreateChatGroupSchema>;
export type UpdateChatGroupData = z.infer<typeof UpdateChatGroupSchema>;
export type AddMemberData = z.infer<typeof AddMemberSchema>;
export type UpdateMemberRoleData = z.infer<typeof UpdateMemberRoleSchema>;
export type SendMessageData = z.infer<typeof SendMessageSchema>;

export type ChatMessagesResponse = z.infer<typeof ChatMessagesResponseSchema>;

export {
  ChatGroupsResponseSchema,
  ChatGroupResponseSchema,
  ChatMembersResponseSchema,
  ChatMemberResponseSchema,
  ChatMessagesResponseSchema,
  ChatMessageResponseSchema,
  CreateChatGroupSchema,
  UpdateChatGroupSchema,
  AddMemberSchema,
  UpdateMemberRoleSchema,
  SendMessageSchema,
};
