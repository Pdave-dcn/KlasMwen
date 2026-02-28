import type { Prisma, ChatRole } from "@prisma/client";

const CircleFragments = {
  userBase: {
    id: true,
    username: true,
    email: true,
    role: true,
  } satisfies Prisma.UserSelect,

  circleBase: {
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

  circleMemberBase: {
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

  circleMessageBase: {
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
  circle: CircleFragments.circleBase,

  circleMember: CircleFragments.circleMemberBase,

  circleMessage: CircleFragments.circleMessageBase,

  circleForDiscovery: {
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

  // Full circle info with member count
  circleWithMembers: {
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
  circleForSearch: {
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

  circleForTrending: {
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

  circleForActive: {
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

  circleSuggestion: {
    id: true,
    name: true,
    _count: {
      select: {
        members: true,
      },
    },
  } satisfies Prisma.ChatGroupSelect,

  circlePreviewDetail: {
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

interface CreateCircleData {
  name: string;
  description?: string;
  isPrivate?: boolean;
  creatorId: string;
  tagIds: number[];
}

interface CreateCircleFinalData extends CreateCircleData {
  avatarId: number;
}

interface UpdateCircleData {
  name?: string;
  description?: string;
  isPrivate?: boolean;
  avatarId?: number;
}

interface JoinCircleData {
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

interface CirclePaginationCursor {
  cursor?: string; // Circle UUID
  limit: number;
}

// Search & Filter Types

interface CircleSearchFilters {
  query?: string; // Search by name or description
  isPrivate?: boolean; // Filter by privacy
  excludeJoined?: boolean; // Exclude groups user is already in
  creatorId?: string; // Filter by creator
  minMembers?: number; // Minimum member count
  maxMembers?: number; // Maximum member count
  tagIds?: number[]; // Filter by tags
}

interface CircleSearchSuggestion {
  id: string;
  name: string;
  memberCount: number;
}

// Search result types for different discovery methods
interface SearchResultMetadata {
  totalResults?: number;
  searchQuery?: string;
  appliedFilters?: Partial<CircleSearchFilters>;
}

// Return Types

type Circle = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.circle;
}>;

type CircleWithMembers = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.circleWithMembers;
}>;

type CircleForDiscovery = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.circleForDiscovery;
}>;

type CircleForSearch = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.circleForSearch;
}>;

type CircleForTrending = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.circleForTrending;
}>;

type CircleForActive = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.circleForActive;
}>;

type CircleSuggestionResult = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.circleSuggestion;
}>;

type CirclePreviewDetail = Prisma.ChatGroupGetPayload<{
  select: typeof BaseSelectors.circlePreviewDetail;
}>;

type TransformedCircleForDiscovery = Omit<
  CircleForDiscovery,
  "_count" | "chatGroupTags"
> & {
  memberCount: number;
  tags: { id: number; name: string }[];
};

type TransformedCircleSuggestion = Omit<CircleSuggestionResult, "_count"> & {
  memberCount: number;
};

type CircleMember = Prisma.ChatMemberGetPayload<{
  select: typeof BaseSelectors.circleMember;
}>;

type EnrichedCircleMember = Omit<CircleMember, "mutedUntil"> & {
  isMuted: boolean;
};

type TransformedCircleMember = Omit<EnrichedCircleMember, "user"> & {
  user: Omit<CircleMember["user"], "Avatar"> & {
    avatar: CircleMember["user"]["Avatar"];
  };
};

type CircleMessage = Prisma.ChatMessageGetPayload<{
  select: typeof BaseSelectors.circleMessage;
}>;

type TransformedCircleMessage = Omit<CircleMessage, "sender"> & {
  sender: Omit<CircleMessage["sender"], "Avatar"> & {
    avatar: CircleMessage["sender"]["Avatar"];
  };
};

type TransformedCirclePreviewDetail = Omit<
  CirclePreviewDetail,
  "creator" | "messages" | "_count" | "chatGroupTags"
> & {
  creator: Omit<CirclePreviewDetail["creator"], "Avatar"> & {
    avatar: CirclePreviewDetail["creator"]["Avatar"];
  };
  lastActivityAt: CirclePreviewDetail["messages"][0]["createdAt"];
  tags: { id: number; name: string }[];
  memberCount: number;
};

// Enriched Types

type EnrichedCircle = Omit<CircleWithMembers, "_count" | "members"> & {
  memberCount: number;
  latestMessage: TransformedCircleMessage | null;
  unreadCount: number;
  userRole?: ChatRole | null;
};

// Page Types

interface MessagePage {
  messages: CircleMessage[];
  nextCursor: number | null;
  hasMore: boolean;
}

interface CircleSearchPage {
  groups: TransformedCircleForDiscovery[];
  nextCursor: string | null;
  hasMore: boolean;
  metadata?: SearchResultMetadata;
}

// Exports

export {
  BaseSelectors,
  // Input types
  type CreateCircleData,
  type CreateCircleFinalData,
  type UpdateCircleData,
  type JoinCircleData,
  type UpdateMemberRoleData,
  type SendMessageData,
  // Pagination types
  type MessagePaginationCursor,
  type CirclePaginationCursor,
  // Search & Filter types
  type CircleSearchFilters,
  type CircleSearchSuggestion,
  type SearchResultMetadata,
  type CircleSearchPage,
  // Return types
  type Circle,
  type CircleWithMembers,
  type CircleForDiscovery,
  type CircleForSearch,
  type CircleForTrending,
  type CircleForActive,
  type CircleSuggestionResult,
  type TransformedCircleForDiscovery,
  type TransformedCircleSuggestion,
  type CircleMember,
  type EnrichedCircleMember,
  type TransformedCircleMember,
  type CircleMessage,
  type TransformedCircleMessage,
  type CirclePreviewDetail,
  type TransformedCirclePreviewDetail,
  // Enriched types
  type EnrichedCircle,
  // Page types
  type MessagePage,
};
