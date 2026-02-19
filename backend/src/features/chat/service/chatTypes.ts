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
    avatar: {
      select: {
        url: true,
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

  chatGroupForDiscovery: {
    id: true,
    name: true,
    description: true,
    isPrivate: true,
    avatar: {
      select: {
        url: true,
      },
    },
    chatGroupTags: {
      include: { tag: true },
    },
    _count: {
      select: {
        members: true,
      },
    },
  } satisfies Prisma.ChatGroupSelect,

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
    avatar: {
      select: {
        url: true,
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

  // Search-specific selectors
  chatGroupForSearch: {
    id: true,
    name: true,
    description: true,
    isPrivate: true,
    avatar: {
      select: {
        url: true,
      },
    },
    chatGroupTags: {
      include: { tag: true },
    },
    _count: {
      select: {
        members: true,
      },
    },
  } satisfies Prisma.ChatGroupSelect,

  chatGroupForTrending: {
    id: true,
    name: true,
    description: true,
    isPrivate: true,
    avatar: {
      select: {
        url: true,
      },
    },
    chatGroupTags: {
      include: { tag: true },
    },
    _count: {
      select: {
        members: true,
        messages: true,
      },
    },
  } satisfies Prisma.ChatGroupSelect,

  chatGroupForActive: {
    id: true,
    name: true,
    description: true,
    isPrivate: true,
    avatar: {
      select: {
        url: true,
      },
    },
    chatGroupTags: {
      include: { tag: true },
    },
    messages: {
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc" as const,
      },
      take: 1,
    },
    _count: {
      select: {
        members: true,
      },
    },
  } satisfies Prisma.ChatGroupSelect,

  chatGroupSuggestion: {
    id: true,
    name: true,
    _count: {
      select: {
        members: true,
      },
    },
  } satisfies Prisma.ChatGroupSelect,

  chatGroupPreviewDetail: {
    id: true,
    name: true,
    description: true,
    avatar: { select: { url: true } },
    isPrivate: true,
    createdAt: true,
    creator: {
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
    messages: {
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    },
    chatGroupTags: {
      include: { tag: true },
    },
    _count: {
      select: {
        members: true,
      },
    },
  } satisfies Prisma.ChatGroupSelect,
} as const;

// Input Types

interface CreateChatGroupData {
  name: string;
  description?: string;
  isPrivate?: boolean;
  creatorId: string;
  tagIds: number[];
}

interface CreateChatGroupFinalData extends CreateChatGroupData {
  avatarId: number;
}

interface UpdateChatGroupData {
  name?: string;
  description?: string;
  isPrivate?: boolean;
  avatarId?: number;
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

// Pagination Types

interface MessagePaginationCursor {
  cursor?: number; // message ID
  limit?: number;
}

interface GroupPaginationCursor {
  cursor?: string; // Group UUID
  limit: number;
}

// Search & Filter Types

interface GroupSearchFilters {
  query?: string; // Search by name or description
  isPrivate?: boolean; // Filter by privacy
  excludeJoined?: boolean; // Exclude groups user is already in
  creatorId?: string; // Filter by creator
  minMembers?: number; // Minimum member count
  maxMembers?: number; // Maximum member count
  tagIds?: number[]; // Filter by tags
}

interface GroupSearchSuggestion {
  id: string;
  name: string;
  memberCount: number;
}

// Search result types for different discovery methods
interface SearchResultMetadata {
  totalResults?: number;
  searchQuery?: string;
  appliedFilters?: Partial<GroupSearchFilters>;
}

// Return Types

type ChatGroup = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.chatGroup;
}>;

type ChatGroupWithMembers = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.chatGroupWithMembers;
}>;

type ChatGroupForDiscovery = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.chatGroupForDiscovery;
}>;

type ChatGroupForSearch = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.chatGroupForSearch;
}>;

type ChatGroupForTrending = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.chatGroupForTrending;
}>;

type ChatGroupForActive = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.chatGroupForActive;
}>;

type ChatGroupSuggestionResult = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.chatGroupSuggestion;
}>;

type ChatGroupPreviewDetail = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.chatGroupPreviewDetail;
}>;

type TransformedChatGroupForDiscovery = Omit<
  ChatGroupForDiscovery,
  "_count" | "chatGroupTags"
> & {
  memberCount: number;
  tags: { id: number; name: string }[];
};

type TransformedChatGroupSuggestion = Omit<
  ChatGroupSuggestionResult,
  "_count"
> & {
  memberCount: number;
};

type ChatMember = Prisma.ChatMemberGetPayload<{
  select: typeof BaseSelectors.chatMember;
}>;

type EnrichedChatMember = Omit<ChatMember, "mutedUntil"> & {
  isMuted: boolean;
};

type TransformedChatMember = Omit<EnrichedChatMember, "user"> & {
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

type TransformedChatGroupPreviewDetail = Omit<
  ChatGroupPreviewDetail,
  "creator" | "messages" | "_count" | "chatGroupTags"
> & {
  creator: Omit<ChatGroupPreviewDetail["creator"], "Avatar"> & {
    avatar: ChatGroupPreviewDetail["creator"]["Avatar"];
  };
  lastActivityAt: ChatGroupPreviewDetail["messages"][0]["createdAt"];
  tags: { id: number; name: string }[];
  memberCount: number;
};

// Enriched Types

type EnrichedChatGroup = Omit<ChatGroupWithMembers, "_count" | "members"> & {
  memberCount: number;
  latestMessage: TransformedChatMessage | null;
  unreadCount: number;
  userRole?: ChatRole | null;
};

// Page Types

interface MessagePage {
  messages: ChatMessage[];
  nextCursor: number | null;
  hasMore: boolean;
}

interface GroupSearchPage {
  groups: TransformedChatGroupForDiscovery[];
  nextCursor: string | null;
  hasMore: boolean;
  metadata?: SearchResultMetadata;
}

// Exports

export {
  BaseSelectors,
  // Input types
  type CreateChatGroupData,
  type CreateChatGroupFinalData,
  type UpdateChatGroupData,
  type JoinChatGroupData,
  type UpdateMemberRoleData,
  type SendMessageData,
  // Pagination types
  type MessagePaginationCursor,
  type GroupPaginationCursor,
  // Search & Filter types
  type GroupSearchFilters,
  type GroupSearchSuggestion,
  type SearchResultMetadata,
  type GroupSearchPage,
  // Return types
  type ChatGroup,
  type ChatGroupWithMembers,
  type ChatGroupForDiscovery,
  type ChatGroupForSearch,
  type ChatGroupForTrending,
  type ChatGroupForActive,
  type ChatGroupSuggestionResult,
  type TransformedChatGroupForDiscovery,
  type TransformedChatGroupSuggestion,
  type ChatMember,
  type EnrichedChatMember,
  type TransformedChatMember,
  type ChatMessage,
  type TransformedChatMessage,
  type ChatGroupPreviewDetail,
  type TransformedChatGroupPreviewDetail,
  // Enriched types
  type EnrichedChatGroup,
  // Page types
  type MessagePage,
};
