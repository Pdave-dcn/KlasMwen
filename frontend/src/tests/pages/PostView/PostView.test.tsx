import { useParams, BrowserRouter } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent } from "@testing-library/react";

import PostView from "@/pages/PostView";
import { useSinglePostQuery } from "@/queries/usePosts";

import { mockPost, mockPost2, mockPostView } from "./mocks";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

vi.mock("@/queries/usePosts", () => ({
  useSinglePostQuery: vi.fn(),
}));

vi.mock("@/features/postView/components/PostLoading", () => ({
  default: () => <div data-testid="post-loading">Loading...</div>,
}));

vi.mock("@/features/postView/components/PostError", () => ({
  default: ({ error, onRetry }: { error: Error; onRetry: () => void }) => (
    <div data-testid="post-error">
      <span>Error: {error.message}</span>
      <button onClick={onRetry} data-testid="retry-button">
        Retry
      </button>
    </div>
  ),
}));

vi.mock("@/features/postView/components/PostNotFound", () => ({
  default: () => <div data-testid="post-not-found">Post not found</div>,
}));

vi.mock("@/components/cards/Comment/CommentCard", () => ({
  default: ({ postId }: { postId: string }) => (
    <div data-testid="comment-card">Comments for post: {postId}</div>
  ),
}));

vi.mock("@/utils/dateFormatter.util", () => ({
  formatDate: vi.fn((date) => `Formatted: ${date}`),
}));

vi.mock("@/utils/getInitials.util", () => ({
  getInitials: vi.fn((name) => name.substring(0, 2).toUpperCase()),
}));

const mockUseParams = vi.mocked(useParams);
const mockUseSinglePostQuery = vi.mocked(useSinglePostQuery);

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

describe("PostView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should render loading component when data is loading", () => {
      mockPostView({ mockUseParams, mockUseSinglePostQuery });

      render(
        <TestWrapper>
          <PostView />
        </TestWrapper>
      );

      expect(screen.getByTestId("post-loading")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should render error component when there is an error", () => {
      const mockError = new Error("Failed to fetch post");
      const mockRefetch = vi.fn();

      mockPostView(
        { mockUseParams, mockUseSinglePostQuery },
        {
          isLoading: false,
          error: mockError,
          refetch: mockRefetch,
        }
      );

      render(
        <TestWrapper>
          <PostView />
        </TestWrapper>
      );

      expect(screen.getByTestId("post-error")).toBeInTheDocument();
      expect(
        screen.getByText("Error: Failed to fetch post")
      ).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("retry-button"));
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Not Found State", () => {
    it("should render not found component when post is null", () => {
      mockPostView(
        { mockUseParams, mockUseSinglePostQuery },
        {
          isLoading: false,
        }
      );

      render(
        <TestWrapper>
          <PostView />
        </TestWrapper>
      );

      expect(screen.getByTestId("post-not-found")).toBeInTheDocument();
    });
  });

  describe("Success State", () => {
    describe("Text Type Post", () => {
      beforeEach(() => {
        mockPostView(
          { mockUseParams, mockUseSinglePostQuery },
          {
            data: mockPost,
            isLoading: false,
          }
        );
      });

      it("should render post content correctly", () => {
        render(
          <TestWrapper>
            <PostView />
          </TestWrapper>
        );

        expect(screen.getByText("Test Post Title")).toBeInTheDocument();

        expect(
          screen.getByText("This is test post content")
        ).toBeInTheDocument();

        expect(screen.getByText("testUser")).toBeInTheDocument();

        expect(
          screen.getByText("Formatted: 2024-01-01 00:00:00")
        ).toBeInTheDocument();
      });

      it("should render tags when present", () => {
        render(
          <TestWrapper>
            <PostView />
          </TestWrapper>
        );

        expect(screen.getByText("React")).toBeInTheDocument();
        expect(screen.getByText("Testing")).toBeInTheDocument();
      });

      it("should render post stats", () => {
        render(
          <TestWrapper>
            <PostView />
          </TestWrapper>
        );

        expect(screen.getByText("5 likes")).toBeInTheDocument();
        expect(screen.getByText("3 comments")).toBeInTheDocument();
      });

      it("should render comment card with correct postId", () => {
        render(
          <TestWrapper>
            <PostView />
          </TestWrapper>
        );

        expect(screen.getByTestId("comment-card")).toBeInTheDocument();
        expect(
          screen.getByText(
            "Comments for post: 5717559b-d7d1-4f56-a5a3-d18e8c6adefe"
          )
        ).toBeInTheDocument();
      });
    });

    describe("Resource Type Post", () => {
      it("should render file attachment when present", () => {
        mockPostView(
          { mockUseParams, mockUseSinglePostQuery },
          {
            data: mockPost2,
            isLoading: false,
          },
          { id: "6b2efb09-e634-41d9-b2eb-d4972fabb729" }
        );
        render(
          <TestWrapper>
            <PostView />
          </TestWrapper>
        );

        expect(screen.getByText("test-file.pdf")).toBeInTheDocument();
        expect(screen.getByText("Download")).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing postId parameter", () => {
      mockPostView(
        { mockUseParams, mockUseSinglePostQuery },
        {
          isLoading: false,
        },
        { id: "" }
      );

      render(
        <TestWrapper>
          <PostView />
        </TestWrapper>
      );

      // Should still call useSinglePostQuery with empty string
      expect(mockUseSinglePostQuery).toHaveBeenCalledWith("");
    });

    it("should render post without tags", () => {
      const postWithoutTags = {
        ...mockPost,
        tags: [],
      };

      mockPostView(
        { mockUseParams, mockUseSinglePostQuery },
        {
          data: postWithoutTags,
          isLoading: false,
        }
      );

      render(
        <TestWrapper>
          <PostView />
        </TestWrapper>
      );

      expect(screen.getByText("Test Post Title")).toBeInTheDocument();
      expect(screen.queryByText("React")).not.toBeInTheDocument();
    });

    it("should render post without content", () => {
      const postWithoutContent = {
        ...mockPost,
        content: null,
      };

      mockPostView(
        { mockUseParams, mockUseSinglePostQuery },
        {
          data: postWithoutContent,
          isLoading: false,
        }
      );

      render(
        <TestWrapper>
          <PostView />
        </TestWrapper>
      );

      expect(screen.getByText("Test Post Title")).toBeInTheDocument();
      expect(
        screen.queryByText("This is test post content")
      ).not.toBeInTheDocument();
    });

    it("should handle zero likes count", () => {
      const postWithoutLikes = {
        ...mockPost,
        _count: {
          likes: 0,
          comments: 3,
        },
      };

      mockPostView(
        { mockUseParams, mockUseSinglePostQuery },
        {
          data: postWithoutLikes,
          isLoading: false,
        }
      );

      render(
        <TestWrapper>
          <PostView />
        </TestWrapper>
      );

      expect(screen.queryByText("0 likes")).not.toBeInTheDocument();
      expect(screen.getByText("3 comments")).toBeInTheDocument();
    });
  });
});
