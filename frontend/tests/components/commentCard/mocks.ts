import { vi } from "vitest";
import { useParentCommentsQuery } from "@/queries/comment.query";

export const mockComments = [
  {
    id: 1,
    content: "This is the first comment",
    parentId: null,
    createdAt: "2024-01-01 10:00:00",
    totalReplies: 2,
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
    content: "This is the second comment",
    parentId: null,
    createdAt: "2024-01-01T11:00:00.000Z",
    totalReplies: 0,
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
      data: mockComments,
      pagination: {
        totalComments: 2,
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
      data: mockComments,
      pagination: {
        totalComments: 5,
        hasMore: true,
        nextCursor: 2,
      },
    },
  ],

  pageParams: [2],
};

type ParentCommentQueryReturn = ReturnType<typeof useParentCommentsQuery>;

export const mockQueryStates = (
  mockUseParentCommentQuery: ReturnType<typeof vi.fn>,
  overrides: Partial<ParentCommentQueryReturn> = {}
) => {
  mockUseParentCommentQuery.mockReturnValue({
    data: undefined,
    isLoading: true,
    error: null,
    ...overrides,
  } as unknown as ParentCommentQueryReturn);
};
