import { useRepliesQuery } from "@/queries/comment.query";

export const mockReplies = [
  {
    id: 1,
    content: "This is the first reply",
    createdAt: "2024-01-01 10:00:00",
    author: {
      id: "user1",
      username: "john_doe",
      avatar: {
        id: 1,
        url: "https://example.com/avatar1.jpg",
      },
    },
  },
  {
    id: 2,
    content: "This is the second reply",
    createdAt: "2024-01-01 11:00:00",
    author: {
      id: "user2",
      username: "jane_smith",
      avatar: {
        id: 2,
        url: "https://example.com/avatar2.jpg",
      },
    },
  },
];

export const mockQueryData = {
  pages: [
    {
      data: mockReplies,
      pagination: {
        hasMore: false,
        nextCursor: null,
      },
    },
  ],

  pageParams: [null],
};

export const mockQueryDataWithMore = {
  pages: [
    {
      data: mockReplies,
      pagination: {
        hasMore: true,
        nextCursor: 2,
      },
    },
  ],

  pageParams: [2],
};

type RepliesQueryReturn = ReturnType<typeof useRepliesQuery>;

export const mockQueryStates = (
  mockUseRepliesQuery: ReturnType<typeof vi.fn>,
  overrides: Partial<RepliesQueryReturn> = {}
) => {
  mockUseRepliesQuery.mockReturnValue({
    data: undefined,
    isLoading: true,
    error: null,
    ...overrides,
  } as unknown as RepliesQueryReturn);
};
