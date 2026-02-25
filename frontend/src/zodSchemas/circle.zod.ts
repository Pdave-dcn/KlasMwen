import { z } from "zod";

// Base Schemas

const CircleRoleSchema = z.enum(["OWNER", "MODERATOR", "MEMBER"]);

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

const StudyCircleCreatorSchema = UserBasicSchema.omit({ avatar: true });

const PaginationSchema = z.object({
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

// Circle Message Schemas

const CircleMessageDataSchema = z.object({
  id: z.number().int(),
  content: z.string(),
  chatGroupId: z.uuid(),
  createdAt: z.string(),
  sender: UserBasicSchema,
});

const CircleMessagesResponseSchema = z.object({
  data: z.array(CircleMessageDataSchema),
  pagination: z.object({
    nextCursor: z.number().int().nullable(),
    hasMore: z.boolean(),
  }),
});

const CircleMessageResponseSchema = z.object({
  data: CircleMessageDataSchema,
});

// Circle Group Schemas

const StudyCircleDataSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isPrivate: z.boolean(),
  createdAt: z.string(),
  creator: StudyCircleCreatorSchema,
  avatar: AvatarSchema,
  memberCount: z.number().int().nonnegative(),
  unreadCount: z.number().int().nonnegative(),
  userRole: CircleRoleSchema.nullable(),
  latestMessage: CircleMessageDataSchema.nullable(),
});

const StudyCirclePreviewSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  avatar: AvatarSchema,
  creator: StudyCircleCreatorSchema.extend({ avatar: AvatarSchema }),
  lastActivityAt: z.string(),
  tags: z.array(TagSchema),
  memberCount: z.number().int().nonnegative(),
  isPrivate: z.boolean(),
  createdAt: z.string(),
});

const StudyCirclePreviewResponseSchema = z.object({
  data: StudyCirclePreviewSchema,
});

const StudyCircleForDiscoverySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isPrivate: z.boolean(),
  avatar: AvatarSchema,
  tags: z.array(TagSchema),
  memberCount: z.number().int().nonnegative(),
});

const StudyCirclesResponseSchema = z.object({
  data: z.array(StudyCircleDataSchema),
});

const StudyCircleResponseSchema = z.object({
  data: StudyCircleDataSchema,
});

const StudyCirclesForDiscoveryResponseSchema = z.object({
  data: z.array(StudyCircleForDiscoverySchema),
  pagination: PaginationSchema,
});

const StudyCircleSearchSuggestionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  memberCount: z.number().int().nonnegative(),
});

const StudyCirclesSearchResponseSchema = z.object({
  data: z.array(StudyCircleSearchSuggestionSchema),
});

// Circle Member Schemas

const CircleMemberDataSchema = z.object({
  userId: z.uuid(),
  role: CircleRoleSchema,
  joinedAt: z.string(),
  isMuted: z.boolean(),
  user: UserBasicSchema,
});

const SocketMemberJoinedDataSchema = z.object({
  user: UserBasicSchema.omit({ avatar: true }),
});

const SocketMemberLeftDataSchema = SocketMemberJoinedDataSchema;

const EnrichedCircleMemberDataSchema = CircleMemberDataSchema.extend({
  isOnline: z.boolean(),
  isPresent: z.boolean(),
});

const CircleMembersResponseSchema = z.object({
  data: z.array(CircleMemberDataSchema),
});

const CircleMemberResponseSchema = z.object({
  data: CircleMemberDataSchema,
});

// Request Schemas

const CreateStudyCircleSchema = z.object({
  name: z
    .string()
    .min(3, "Study circle name must be at least 3 characters")
    .max(50, "Study circle name must be less than 50 characters"),
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

const UpdateStudyCircleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullish(),
  isPrivate: z.boolean().optional(),
});

const AddMemberSchema = z.object({
  userId: z.uuid(),
  role: CircleRoleSchema.optional(),
});

const UpdateMemberRoleSchema = z.object({
  role: CircleRoleSchema,
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

export type CircleAttachedUser = z.infer<typeof UserBasicSchema>;
export type StudyCircleRole = z.infer<typeof CircleRoleSchema>;
export type StudyCircle = z.infer<typeof StudyCircleDataSchema>;
export type CircleMember = z.infer<typeof CircleMemberDataSchema>;
export type MemberJoinedData = z.infer<typeof SocketMemberJoinedDataSchema>;
export type MemberLeftData = z.infer<typeof SocketMemberLeftDataSchema>;
export type EnrichedCircleMember = z.infer<
  typeof EnrichedCircleMemberDataSchema
>;
export type CircleMessage = z.infer<typeof CircleMessageDataSchema>;

export type QuickStats = z.infer<typeof QuickStatsSchema>;
export type QuickStatsResponse = z.infer<typeof QuickStatsResponseSchema>;

export type StudyCircleForDiscovery = z.infer<
  typeof StudyCircleForDiscoverySchema
>;
export type StudyCirclesForDiscoveryResponseSchema = z.infer<
  typeof StudyCirclesForDiscoveryResponseSchema
>;
export type SearchSuggestion = z.infer<
  typeof StudyCircleSearchSuggestionSchema
>;

export type CreateStudyCircleData = z.infer<typeof CreateStudyCircleSchema>;
export type UpdateStudyCircleData = z.infer<typeof UpdateStudyCircleSchema>;
export type AddMemberData = z.infer<typeof AddMemberSchema>;
export type UpdateMemberRoleData = z.infer<typeof UpdateMemberRoleSchema>;
export type SendMessageData = z.infer<typeof SendMessageSchema>;

export type CreateCircleFormData = z.infer<typeof CreateStudyCircleSchema>;

export type StudyCirclePreview = z.infer<typeof StudyCirclePreviewSchema>;

export type CircleMessagesResponse = z.infer<
  typeof CircleMessagesResponseSchema
>;
export type StudyCircleResponse = z.infer<typeof StudyCircleDataSchema>;

export {
  StudyCirclesResponseSchema,
  StudyCircleResponseSchema,
  CircleMembersResponseSchema,
  CircleMemberResponseSchema,
  EnrichedCircleMemberDataSchema,
  CircleMessagesResponseSchema,
  CircleMessageResponseSchema,
  CreateStudyCircleSchema,
  UpdateStudyCircleSchema,
  AddMemberSchema,
  UpdateMemberRoleSchema,
  SendMessageSchema,
  SocketMemberJoinedDataSchema,
  SocketMemberLeftDataSchema,
  StudyCirclesForDiscoveryResponseSchema,
  QuickStatsResponseSchema,
  StudyCircleSearchSuggestionSchema,
  StudyCirclesSearchResponseSchema,
  StudyCirclePreviewSchema,
  StudyCirclePreviewResponseSchema,
};
