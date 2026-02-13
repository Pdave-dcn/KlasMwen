import { z } from "zod";

// Base Schemas

const ChatRoleSchema = z.enum(["OWNER", "MODERATOR", "MEMBER"]);

const AvatarSchema = z
  .object({
    url: z.url(),
  })
  .nullable();

const TagSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
});

const UserBasicSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  avatar: AvatarSchema,
});

const ChatGroupCreatorSchema = UserBasicSchema.omit({ avatar: true });

const PaginationSchema = z.object({
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

// Chat Message Schemas

const ChatMessageDataSchema = z.object({
  id: z.number().int(),
  content: z.string(),
  chatGroupId: z.uuid(),
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

// Chat Group Schemas

const ChatGroupDataSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isPrivate: z.boolean(),
  createdAt: z.string(),
  creator: ChatGroupCreatorSchema,
  avatar: AvatarSchema,
  memberCount: z.number().int().nonnegative(),
  unreadCount: z.number().int().nonnegative(),
  userRole: ChatRoleSchema.nullable(),
  latestMessage: ChatMessageDataSchema.nullable(),
});

const ChatGroupForDiscoverySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isPrivate: z.boolean(),
  avatar: AvatarSchema,
  tags: z.array(TagSchema),
  memberCount: z.number().int().nonnegative(),
});

const ChatGroupsResponseSchema = z.object({
  data: z.array(ChatGroupDataSchema),
});

const ChatGroupResponseSchema = z.object({
  data: ChatGroupDataSchema,
});

const ChatGroupsForDiscoveryResponseSchema = z.object({
  data: z.array(ChatGroupForDiscoverySchema),
  pagination: PaginationSchema,
});

const ChatGroupSearchSuggestionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  memberCount: z.number().int().nonnegative(),
});

const ChatGroupsSearchResponseSchema = z.object({
  data: z.array(ChatGroupSearchSuggestionSchema),
});

// Chat Member Schemas

const ChatMemberDataSchema = z.object({
  userId: z.uuid(),
  role: ChatRoleSchema,
  joinedAt: z.string(),
  isMuted: z.boolean(),
  user: UserBasicSchema,
});

const SocketMemberJoinedDataSchema = z.object({
  user: UserBasicSchema.omit({ avatar: true }),
});

const SocketMemberLeftDataSchema = SocketMemberJoinedDataSchema;

const EnrichedChatMemberDataSchema = ChatMemberDataSchema.extend({
  isOnline: z.boolean(),
  isPresent: z.boolean(),
});

const ChatMembersResponseSchema = z.object({
  data: z.array(ChatMemberDataSchema),
});

const ChatMemberResponseSchema = z.object({
  data: ChatMemberDataSchema,
});

// Request Schemas

const CreateChatGroupSchema = z.object({
  name: z
    .string()
    .min(3, "Group name must be at least 3 characters")
    .max(50, "Group name must be less than 50 characters"),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
  isPrivate: z.boolean(),
  tagIds: z
    .array(z.number().int().positive())
    .max(10, "Maximum 10 tags allowed")
    .optional(),
});

const UpdateChatGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullish(),
  isPrivate: z.boolean().optional(),
});

const AddMemberSchema = z.object({
  userId: z.uuid(),
  role: ChatRoleSchema.optional(),
});

const UpdateMemberRoleSchema = z.object({
  role: ChatRoleSchema,
});

const SendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
});

// Statistics

const QuickStatsSchema = z.object({
  activeGroups: z.number().int().nonnegative(),
  unreadMessages: z.number().int().nonnegative(),
  studyPartners: z.number().int().nonnegative(),
});

const QuickStatsResponseSchema = z.object({
  data: QuickStatsSchema,
});

// Exported Types

export type ChatAttachedUser = z.infer<typeof UserBasicSchema>;
export type ChatRole = z.infer<typeof ChatRoleSchema>;
export type ChatGroup = z.infer<typeof ChatGroupDataSchema>;
export type ChatMember = z.infer<typeof ChatMemberDataSchema>;
export type MemberJoinedData = z.infer<typeof SocketMemberJoinedDataSchema>;
export type MemberLeftData = z.infer<typeof SocketMemberLeftDataSchema>;
export type EnrichedChatMember = z.infer<typeof EnrichedChatMemberDataSchema>;
export type ChatMessage = z.infer<typeof ChatMessageDataSchema>;

export type QuickStats = z.infer<typeof QuickStatsSchema>;
export type QuickStatsResponse = z.infer<typeof QuickStatsResponseSchema>;

export type ChatGroupForDiscovery = z.infer<typeof ChatGroupForDiscoverySchema>;
export type ChatGroupsForDiscoveryResponseSchema = z.infer<
  typeof ChatGroupsForDiscoveryResponseSchema
>;
export type SearchSuggestion = z.infer<typeof ChatGroupSearchSuggestionSchema>;

export type CreateChatGroupData = z.infer<typeof CreateChatGroupSchema>;
export type UpdateChatGroupData = z.infer<typeof UpdateChatGroupSchema>;
export type AddMemberData = z.infer<typeof AddMemberSchema>;
export type UpdateMemberRoleData = z.infer<typeof UpdateMemberRoleSchema>;
export type SendMessageData = z.infer<typeof SendMessageSchema>;

export type CreateGroupFormData = z.infer<typeof CreateChatGroupSchema>;

export type ChatMessagesResponse = z.infer<typeof ChatMessagesResponseSchema>;
export type ChatGroupResponse = z.infer<typeof ChatGroupDataSchema>;

export {
  ChatGroupsResponseSchema,
  ChatGroupResponseSchema,
  ChatMembersResponseSchema,
  ChatMemberResponseSchema,
  EnrichedChatMemberDataSchema,
  ChatMessagesResponseSchema,
  ChatMessageResponseSchema,
  CreateChatGroupSchema,
  UpdateChatGroupSchema,
  AddMemberSchema,
  UpdateMemberRoleSchema,
  SendMessageSchema,
  SocketMemberJoinedDataSchema,
  SocketMemberLeftDataSchema,
  ChatGroupsForDiscoveryResponseSchema,
  QuickStatsResponseSchema,
  ChatGroupSearchSuggestionSchema,
  ChatGroupsSearchResponseSchema,
};
