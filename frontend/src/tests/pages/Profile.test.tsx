import { BrowserRouter, useParams } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Profile from "@/pages/Profile";
import { useProfilePosts } from "@/queries/usePosts";
import useProfile from "@/queries/useProfile";
import type { ActiveUser, PublicUser } from "@/types/user.type";

vi.mock("@/queries/useProfile", () => ({
  default: vi.fn(),
}));
vi.mock("@/queries/usePosts", () => ({
  useProfilePosts: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

const mockUseProfile = vi.mocked(useProfile);
const mockUseProfilePosts = vi.mocked(useProfilePosts);
const mockUseParams = vi.mocked(useParams);

vi.mock("@/components/ui/spinner", () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}));

const mockActiveUserId = "a8e4fabb-429e-4532-bec5-e0e2c41abef5";
const mockPublicUserId = "7cbe74a6-6575-448c-8c24-f5e371a4f0df";

const mockActiveUser: ActiveUser = {
  id: mockActiveUserId,
  username: "johnDoe",
  email: "john@example.com",
  role: "STUDENT" as const,
  bio: "Active user mock bio",
  avatar: {
    id: 1,
    url: "http://mock-avatar-url.com",
  },
  createdAt: "2025-08-31",
};

const mockPublicUser: PublicUser = {
  id: mockPublicUserId,
  username: "janeDoe",
  role: "STUDENT" as const,
  bio: "Active user mock bio",
  avatar: {
    id: 1,
    url: "https://mock-avatar-url.com",
  },
};

const mockActiveUserPosts = {
  data: [
    {
      id: "post-1",
      title: "Understanding Async/Await in JavaScript",
      content:
        "Async/await makes handling promises much easier to read and write.",
      type: "NOTE",
      fileUrl: null,
      fileName: null,
      createdAt: "2025-08-30 14:12:00",
      author: {
        id: mockActiveUserId,
        username: mockActiveUser.username,
        avatar: {
          id: 1,
          url: "https://mock-avatar-url.com",
        },
      },
      tags: [
        { id: 1, name: "JavaScript" },
        { id: 2, name: "Async" },
      ],
      _count: {
        comments: 4,
        likes: 12,
      },
    },
    {
      id: "post-2",
      title: "What’s the difference between type and interface in TypeScript?",
      content: "Can someone explain when to use type vs interface?",
      type: "QUESTION",
      fileUrl: null,
      fileName: null,
      createdAt: "2025-08-31 09:45:00",
      author: {
        id: mockActiveUserId,
        username: mockActiveUser.username,
        avatar: {
          id: 2,
          url: "https://mock-avatar.com/2.png",
        },
      },
      tags: [
        { id: 3, name: "TypeScript" },
        { id: 4, name: "Types" },
      ],
      _count: {
        comments: 10,
        likes: 25,
      },
    },
    {
      id: "post-3",
      title: "React Hooks Cheatsheet (PDF)",
      content: null,
      type: "RESOURCE",
      fileUrl: "https://mock-resources.com/react-hooks.pdf",
      fileName: "react-hooks.pdf",
      createdAt: "2025-09-01 17:20:00",
      author: {
        id: mockActiveUserId,
        username: mockActiveUser.username,
        avatar: {
          id: 3,
          url: "https://mock-avatar-2.com",
        },
      },
      tags: [
        { id: 5, name: "React" },
        { id: 6, name: "Hooks" },
      ],
      _count: {
        comments: 7,
        likes: 40,
      },
    },
  ],
  pagination: {
    hasMore: true,
    nextCursor: "post-4",
  },
};

const mockPublicUserPosts = {
  data: [
    {
      id: "pub-post-1",
      title: "Getting Started with Node.js",
      content: "Here’s a quick overview of how to set up a Node.js project.",
      type: "NOTE",
      fileUrl: null,
      fileName: null,
      createdAt: "2025-08-25 10:30:00",
      author: {
        id: mockPublicUserId,
        username: mockPublicUser.username,
        avatar: {
          id: 10,
          url: "https://mock-avatar-url.com/jane.png",
        },
      },
      tags: [
        { id: 10, name: "Node.js" },
        { id: 11, name: "Backend" },
      ],
      _count: {
        comments: 2,
        likes: 15,
      },
    },
    {
      id: "pub-post-2",
      title: "How do I center a div in CSS?",
      content: "Is there a modern way to do this without hacks?",
      type: "QUESTION",
      fileUrl: null,
      fileName: null,
      createdAt: "2025-08-28 16:00:00",
      author: {
        id: mockPublicUserId,
        username: mockPublicUser.username,
        avatar: {
          id: 11,
          url: "https://mock-avatar-url.com/jane2.png",
        },
      },
      tags: [
        { id: 12, name: "CSS" },
        { id: 13, name: "Frontend" },
      ],
      _count: {
        comments: 5,
        likes: 22,
      },
    },
    {
      id: "pub-post-3",
      title: "GraphQL API Best Practices",
      content: null,
      type: "RESOURCE",
      fileUrl: "https://mock-resources.com/graphql-best-practices.pdf",
      fileName: "graphql-best-practices.pdf",
      createdAt: "2025-09-01 08:15:00",
      author: {
        id: mockPublicUserId,
        username: mockPublicUser.username,
        avatar: {
          id: 12,
          url: "https://mock-avatar-url.com/jane3.png",
        },
      },
      tags: [
        { id: 14, name: "GraphQL" },
        { id: 15, name: "API" },
      ],
      _count: {
        comments: 3,
        likes: 30,
      },
    },
  ],
  pagination: {
    hasMore: false,
    nextCursor: null,
  },
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe("Profile Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading States", () => {
    it("shows Spinner when loading", async () => {
      mockUseParams.mockReturnValue({});
      mockUseProfile.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useProfile>);

      mockUseProfilePosts.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useProfilePosts>);

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("spinner")).toBeInTheDocument();
      });
    });

    it("shows Spinner for posts tabs after user data is loaded", async () => {
      mockUseParams.mockReturnValue({ id: mockPublicUserId });
      mockUseProfile.mockReturnValue({
        data: mockPublicUser,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfile>);

      mockUseProfilePosts.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useProfilePosts>);

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockUseProfile).toHaveBeenCalledWith(mockPublicUserId);
        expect(screen.getByTestId("spinner")).toBeInTheDocument();
      });
    });
  });

  describe("Success States", () => {
    it("renders profile header and tabs when user data is loaded", async () => {
      mockUseParams.mockReturnValue({ id: mockPublicUserId });
      mockUseProfile.mockReturnValue({
        data: mockPublicUser,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfile>);

      mockUseProfilePosts.mockReturnValue({
        data: {
          pages: [{ data: [] }],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as unknown as ReturnType<typeof useProfilePosts>);

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockUseProfile).toHaveBeenCalledWith(mockPublicUserId);
        expect(
          screen.getAllByRole("heading", { name: /janedoe/i })
        ).toHaveLength(2);
        expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      });
    });

    it("handles self profile when isSelf prop is true", async () => {
      mockUseParams.mockReturnValue({});
      mockUseProfile.mockReturnValue({
        data: mockActiveUser,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfile>);

      mockUseProfilePosts.mockReturnValue({
        data: {
          pages: [{ data: [] }],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as unknown as ReturnType<typeof useProfilePosts>);

      render(
        <TestWrapper>
          <Profile isSelf />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockUseProfile).toHaveBeenCalledWith(undefined);
        expect(
          screen.getAllByRole("heading", { name: /johndoe/i })
        ).toHaveLength(2);
        expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      });
    });

    it("renders self profile with Posts, Liked, and Saved tabs", async () => {
      mockUseParams.mockReturnValue({});
      mockUseProfile.mockReturnValue({
        data: mockActiveUser,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfile>);

      mockUseProfilePosts.mockReturnValue({
        data: {
          pages: [{ data: [] }],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as unknown as ReturnType<typeof useProfilePosts>);

      render(
        <TestWrapper>
          <Profile isSelf />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockUseProfile).toHaveBeenCalledWith(undefined);
        expect(
          screen.getAllByRole("heading", { name: /johndoe/i })
        ).toHaveLength(2);
        expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /posts/i })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /liked/i })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /saved/i })).toBeInTheDocument();
      });
    });

    it("renders other profile with Posts, Replies, and media tabs", async () => {
      mockUseParams.mockReturnValue({ id: mockPublicUserId });
      mockUseProfile.mockReturnValue({
        data: mockPublicUser,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfile>);

      mockUseProfilePosts.mockReturnValue({
        data: {
          pages: [{ data: [] }],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as unknown as ReturnType<typeof useProfilePosts>);

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockUseProfile).toHaveBeenCalledWith(mockPublicUserId);
        expect(
          screen.getAllByRole("heading", { name: /janedoe/i })
        ).toHaveLength(2);
        expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /posts/i })).toBeInTheDocument();
        expect(
          screen.getByRole("tab", { name: /replies/i })
        ).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /media/i })).toBeInTheDocument();
      });
    });

    it("refetches data when route parameter changes", () => {
      mockUseParams.mockReturnValue({});

      const { rerender } = render(
        <TestWrapper>
          <Profile isSelf />
        </TestWrapper>
      );

      expect(mockUseProfile).toHaveBeenCalledWith(undefined);

      mockUseParams.mockReturnValue({ id: mockPublicUserId });
      rerender(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      expect(mockUseProfile).toHaveBeenCalledWith(mockPublicUserId);
    });

    it("shows a message when no posts are found", async () => {
      mockUseParams.mockReturnValue({ id: mockPublicUserId });
      mockUseProfile.mockReturnValue({
        data: mockPublicUser,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfile>);

      mockUseProfilePosts.mockReturnValue({
        data: {
          pages: [{ data: [] }],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as unknown as ReturnType<typeof useProfilePosts>);

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /no posts/i })
        ).toBeInTheDocument();
      });
    });

    it("allows switching from one tab to another", async () => {
      const user = userEvent.setup();
      mockUseParams.mockReturnValue({ id: mockPublicUserId });
      mockUseProfile.mockReturnValue({
        data: mockPublicUser,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfile>);

      mockUseProfilePosts.mockReturnValue({
        data: {
          pages: [{ data: [] }],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as unknown as ReturnType<typeof useProfilePosts>);

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      await user.click(screen.getByRole("tab", { name: /replies/i }));

      await waitFor(() => {
        expect(
          screen.queryByRole("heading", { name: /no posts/i })
        ).not.toBeInTheDocument();
        expect(
          screen.getByRole("heading", { name: /no replies/i })
        ).toBeInTheDocument();
      });
    });

    it("renders posts when they are found", async () => {
      mockUseParams.mockReturnValue({ id: mockPublicUserId });
      mockUseProfile.mockReturnValue({
        data: mockPublicUser,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfile>);

      mockUseProfilePosts.mockReturnValue({
        data: {
          pages: [
            {
              data: mockPublicUserPosts.data,
              pagination: mockPublicUserPosts.pagination,
            },
          ],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        fetchNextPage: vi.fn(),
        hasNextPage: mockPublicUserPosts.pagination.hasMore,
        isFetchingNextPage: false,
      } as unknown as ReturnType<typeof useProfilePosts>);

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /getting started with node.js/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { name: /how do i center a div in css/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { name: /graphql api best practices/i })
        ).toBeInTheDocument();
      });
    });

    it("renders posts and show Load More button when hasNextPage is true", async () => {
      mockUseParams.mockReturnValue({});
      mockUseProfile.mockReturnValue({
        data: mockActiveUser,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfile>);

      mockUseProfilePosts.mockReturnValue({
        data: {
          pages: [
            {
              data: mockActiveUserPosts.data,
              pagination: mockActiveUserPosts.pagination,
            },
          ],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        fetchNextPage: vi.fn(),
        hasNextPage: mockActiveUserPosts.pagination.hasMore,
        isFetchingNextPage: false,
      } as unknown as ReturnType<typeof useProfilePosts>);

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByRole("heading", {
            name: /Understanding Async\/Await in JavaScript/i,
          })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { name: /React Hooks Cheatsheet/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /load more/i })
        ).toBeInTheDocument();
      });
    });

    it("calls fetchNextPage when Load More button is clicked", async () => {
      const user = userEvent.setup();
      const mockFetchNextPage = vi.fn();

      mockUseParams.mockReturnValue({});
      mockUseProfile.mockReturnValue({
        data: mockActiveUser,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfile>);

      mockUseProfilePosts.mockReturnValue({
        data: {
          pages: [
            {
              data: mockActiveUserPosts.data,
              pagination: mockActiveUserPosts.pagination,
            },
          ],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: false,
      } as unknown as ReturnType<typeof useProfilePosts>);

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      await user.click(screen.getByRole("button", { name: /load more/i }));

      expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
    });

    it("shows loading state for Load More button when isFetchingNextPage is true", async () => {
      const user = userEvent.setup();
      const mockFetchNextPage = vi.fn();

      mockUseParams.mockReturnValue({});
      mockUseProfile.mockReturnValue({
        data: mockActiveUser,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfile>);

      mockUseProfilePosts.mockReturnValue({
        data: {
          pages: [
            {
              data: mockActiveUserPosts.data,
              pagination: mockActiveUserPosts.pagination,
            },
          ],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: true,
      } as unknown as ReturnType<typeof useProfilePosts>);

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /loading/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error States", () => {
    it("handles useProfile error gracefully", async () => {
      mockUseParams.mockReturnValue({ id: mockPublicUserId });
      mockUseProfile.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch user"),
      } as unknown as ReturnType<typeof useProfile>);

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /error/i })
        ).toBeInTheDocument();
      });
    });

    it("handles useProfilePosts error gracefully", async () => {
      mockUseParams.mockReturnValue({ id: mockPublicUserId });
      mockUseProfile.mockReturnValue({
        data: mockPublicUser,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfile>);

      mockUseProfilePosts.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch posts"),
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as unknown as ReturnType<typeof useProfilePosts>);

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /error/i })
        ).toBeInTheDocument();
      });
    });

    it("shows error message when user is undefined and not loading", async () => {
      mockUseParams.mockReturnValue({ id: mockPublicUserId });
      mockUseProfile.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProfile>);

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getAllByRole("heading", { name: /user not found/i })
        ).toHaveLength(2);
      });
    });
  });
});
