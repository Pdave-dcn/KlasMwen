import type { Prisma, ChatRole } from "@prisma/client";

const ChatFragments = {
  userBase: {
    id: true,
    username: true,
    email: true,
    role: true,
  } satisfies Prisma.UserSelect,

  chatGroupBase: {
    id: true,
    name: true,
    description: true,
    isPrivate: true,
    createdAt: true,
    creator: {
      select: {
        id: true,
        username: true,
      },
    },
  } satisfies Prisma.ChatGroupSelect,

  chatMemberBase: {
    userId: true,
    role: true,
    joinedAt: true,
    mutedUntil: true,
    user: {
      select: {
        id: true,
        username: true,
        Avatar: {
          select: {
            url: true,
          },
        },
      },
    },
  } satisfies Prisma.ChatMemberSelect,

  chatMessageBase: {
    id: true,
    content: true,
    chatGroupId: true,
    createdAt: true,
    sender: {
      select: {
        id: true,
        username: true,
        Avatar: {
          select: {
            url: true,
          },
        },
      },
    },
  } satisfies Prisma.ChatMessageSelect,
} as const;

const BaseSelectors = {
  chatGroup: ChatFragments.chatGroupBase,

  chatMember: ChatFragments.chatMemberBase,

  chatMessage: ChatFragments.chatMessageBase,

  // Full group info with member count
  chatGroupWithMembers: {
    id: true,
    name: true,
    description: true,
    isPrivate: true,
    createdAt: true,
    creator: {
      select: {
        id: true,
        username: true,
      },
    },
    members: {
      select: {
        lastReadAt: true,
      },
    },
    _count: {
      select: {
        members: true,
      },
    },
  } satisfies Prisma.ChatGroupSelect,
} as const;

// Input types
interface CreateChatGroupData {
  name: string;
  description?: string;
  isPrivate?: boolean;
  creatorId: string;
}

interface UpdateChatGroupData {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}

interface JoinChatGroupData {
  userId: string;
  chatGroupId: string;
  role?: ChatRole;
}

interface UpdateMemberRoleData {
  role: ChatRole;
}

interface SendMessageData {
  content: string;
  senderId: string;
  chatGroupId: string;
}

interface MessagePaginationCursor {
  cursor?: number; // message ID
  limit?: number;
}

// Return types
type ChatGroup = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.chatGroup;
}>;

type ChatGroupWithMembers = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.chatGroupWithMembers;
}>;

type ChatMember = Prisma.ChatMemberGetPayload<{
  select: typeof BaseSelectors.chatMember;
}>;

type TransformedChatMember = Omit<ChatMember, "user"> & {
  user: Omit<ChatMember["user"], "Avatar"> & {
    avatar: ChatMember["user"]["Avatar"];
  };
};

type ChatMessage = Prisma.ChatMessageGetPayload<{
  select: typeof BaseSelectors.chatMessage;
}>;

type TransformedChatMessage = Omit<ChatMessage, "sender"> & {
  sender: Omit<ChatMessage["sender"], "Avatar"> & {
    avatar: ChatMessage["sender"]["Avatar"];
  };
};

// Enriched types
type EnrichedChatGroup = Omit<ChatGroupWithMembers, "_count" | "members"> & {
  memberCount: number;
  latestMessage: TransformedChatMessage | null;
  unreadCount: number;
  userRole?: ChatRole | null;
};

interface MessagePage {
  messages: ChatMessage[];
  nextCursor: number | null;
  hasMore: boolean;
}

export {
  BaseSelectors,
  type CreateChatGroupData,
  type UpdateChatGroupData,
  type JoinChatGroupData,
  type UpdateMemberRoleData,
  type SendMessageData,
  type MessagePaginationCursor,
  type ChatGroup,
  type ChatGroupWithMembers,
  type ChatMember,
  type TransformedChatMember,
  type ChatMessage,
  type TransformedChatMessage,
  type EnrichedChatGroup,
  type MessagePage,
};
