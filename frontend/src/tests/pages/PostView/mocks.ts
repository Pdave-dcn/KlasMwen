import type { useSinglePostQuery } from "@/queries/usePosts";

export const mockPost = {
  id: "5717559b-d7d1-4f56-a5a3-d18e8c6adefe",
  title: "Test Post Title",
  content: "This is test post content",
  type: "NOTE" as const,
  createdAt: "2024-01-01 00:00:00",
  fileUrl: null,
  fileName: null,
  fileSize: null,
  isBookmarked: true,
  isLiked: false,
  author: {
    id: "author1",
    username: "testUser",
    avatar: {
      id: 3,
      url: "https://example.com/avatar.jpg",
    },
  },
  tags: [
    { id: 1, name: "React" },
    { id: 2, name: "Testing" },
  ],
  _count: {
    likes: 5,
    comments: 3,
  },
};

export const mockPost2 = {
  id: "6b2efb09-e634-41d9-b2eb-d4972fabb729",
  title: "Test Post Title 2",
  content: null,
  type: "RESOURCE" as const,
  createdAt: "2024-01-01 00:00:00",
  fileUrl: "https://example.com/file.pdf",
  fileName: "test-file.pdf",
  fileSize: 10000,
  isBookmarked: true,
  isLiked: false,
  author: {
    id: "author12",
    username: "testUser",
    avatar: {
      id: 2,
      url: "https://example.com/avatar-2.jpg",
    },
  },
  tags: [
    { id: 1, name: "React" },
    { id: 2, name: "Testing" },
  ],
  _count: {
    likes: 5,
    comments: 3,
  },
};

type SinglePostQueryReturn = ReturnType<typeof useSinglePostQuery>;

export const mockPostView = (
  mocks: {
    mockUseParams: ReturnType<typeof vi.fn>;
    mockUseSinglePostQuery: ReturnType<typeof vi.fn>;
  },
  overrides: Partial<SinglePostQueryReturn> = {},
  params: Partial<{ id: string }> = {}
) => {
  const { mockUseParams, mockUseSinglePostQuery } = mocks;

  mockUseParams.mockReturnValue({
    id: "5717559b-d7d1-4f56-a5a3-d18e8c6adefe",
    ...params,
  });

  mockUseSinglePostQuery.mockReturnValue({
    data: undefined,
    isLoading: true,
    error: null,
    ...overrides,
  } as unknown as SinglePostQueryReturn);
};
