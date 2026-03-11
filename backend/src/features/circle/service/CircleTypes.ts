import type { Prisma, CircleRole } from "@prisma/client";

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
  } satisfies Prisma.CircleSelect,

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
  } satisfies Prisma.CircleMemberSelect,

  circleMessageBase: {
    id: true,
    content: true,
    circleId: true,
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
  } satisfies Prisma.CircleMessageSelect,

  circleLatestMessageBase: {
    id: true,
    content: true,
    createdAt: true,
    sender: {
      select: {
        id: true,
        username: true,
      },
    },
  },
} as const;

const BaseSelectors = {
  circle: CircleFragments.circleBase,

  circleMember: CircleFragments.circleMemberBase,

  circleMessage: CircleFragments.circleMessageBase,

  circleLatestMessage: CircleFragments.circleLatestMessageBase,

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
    circleTags: {
      include: { tag: true },
    },
    _count: {
      select: {
        members: true,
      },
    },
  } satisfies Prisma.CircleSelect,

  // Full circle info with member count and latest message for enrichment
  circleWithMembersAndLatestMsg: {
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
        userId: true,
        role: true,
        lastReadAt: true,
      },
    },
    messages: {
      select: CircleFragments.circleLatestMessageBase,
      orderBy: { createdAt: "desc" },
      take: 1,
    },
    _count: {
      select: {
        members: true,
      },
    },
  } satisfies Prisma.CircleSelect,

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
    circleTags: {
      include: { tag: true },
    },
    _count: {
      select: {
        members: true,
      },
    },
  } satisfies Prisma.CircleSelect,

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
    circleTags: {
      include: { tag: true },
    },
    _count: {
      select: {
        members: true,
        messages: true,
      },
    },
  } satisfies Prisma.CircleSelect,

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
    circleTags: {
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
  } satisfies Prisma.CircleSelect,

  circleSuggestion: {
    id: true,
    name: true,
    _count: {
      select: {
        members: true,
      },
    },
  } satisfies Prisma.CircleSelect,

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
    circleTags: {
      include: { tag: true },
    },
    _count: {
      select: {
        members: true,
      },
    },
  } satisfies Prisma.CircleSelect,
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
  circleId: string;
  role?: CircleRole;
}

interface UpdateMemberRoleData {
  role: CircleRole;
}

interface SendMessageData {
  content: string;
  senderId: string;
  circleId: string;
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

type Circle = Prisma.CircleGetPayload<{
  select: typeof BaseSelectors.circle;
}>;

type CircleWithMembersAndLatestMsg = Prisma.CircleGetPayload<{
  select: typeof BaseSelectors.circleWithMembersAndLatestMsg;
}>;

type CircleForDiscovery = Prisma.CircleGetPayload<{
  select: typeof BaseSelectors.circleForDiscovery;
}>;

type CircleForSearch = Prisma.CircleGetPayload<{
  select: typeof BaseSelectors.circleForSearch;
}>;

type CircleForTrending = Prisma.CircleGetPayload<{
  select: typeof BaseSelectors.circleForTrending;
}>;

type CircleForActive = Prisma.CircleGetPayload<{
  select: typeof BaseSelectors.circleForActive;
}>;

type CircleSuggestionResult = Prisma.CircleGetPayload<{
  select: typeof BaseSelectors.circleSuggestion;
}>;

type CirclePreviewDetail = Prisma.CircleGetPayload<{
  select: typeof BaseSelectors.circlePreviewDetail;
}>;

type TransformedCircleForDiscovery = Omit<
  CircleForDiscovery,
  "_count" | "circleTags"
> & {
  memberCount: number;
  tags: { id: number; name: string }[];
};

type TransformedCircleSuggestion = Omit<CircleSuggestionResult, "_count"> & {
  memberCount: number;
};

type CircleMember = Prisma.CircleMemberGetPayload<{
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

type CircleMessage = Prisma.CircleMessageGetPayload<{
  select: typeof BaseSelectors.circleMessage;
}>;

type CircleLatestMessage = Prisma.CircleMessageGetPayload<{
  select: typeof BaseSelectors.circleLatestMessage;
}>;

type TransformedCircleMessage = Omit<CircleMessage, "sender"> & {
  sender: Omit<CircleMessage["sender"], "Avatar"> & {
    avatar: CircleMessage["sender"]["Avatar"];
  };
};

type TransformedCirclePreviewDetail = Omit<
  CirclePreviewDetail,
  "creator" | "messages" | "_count" | "circleTags"
> & {
  creator: Omit<CirclePreviewDetail["creator"], "Avatar"> & {
    avatar: CirclePreviewDetail["creator"]["Avatar"];
  };
  lastActivityAt: CirclePreviewDetail["messages"][0]["createdAt"];
  tags: { id: number; name: string }[];
  memberCount: number;
};

// Enriched Types

type EnrichedCircle = Omit<
  CircleWithMembersAndLatestMsg,
  "_count" | "members"
> & {
  memberCount: number;
  latestMessage: TransformedCircleMessage | CircleLatestMessage | null;
  unreadCount: number;
  userRole?: CircleRole | null;
};

// Page Types

interface MessagePage {
  messages: CircleMessage[];
  nextCursor: number | null;
  hasMore: boolean;
}

interface CircleSearchPage {
  circles: TransformedCircleForDiscovery[];
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
  type CircleWithMembersAndLatestMsg,
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
  type CircleLatestMessage,
  type TransformedCircleMessage,
  type CirclePreviewDetail,
  type TransformedCirclePreviewDetail,
  // Enriched types
  type EnrichedCircle,
  // Page types
  type MessagePage,
};
