import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter, useNavigate } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";

import CommentCard from "@/components/cards/Comment/CommentCard";
import { useParentCommentsQuery } from "@/queries/comment.query";
import { useAuthStore } from "@/stores/auth.store";

import {
  mockComments,
  mockQueryData,
  mockQueryDataWithMore,
  mockQueryStates,
} from "./mocks";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock("@/queries/comment.query", () => ({
  useParentCommentsQuery: vi.fn(),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("@/components/LoadMoreButton", () => ({
  default: ({
    isLoading,
    onClick,
    style,
  }: {
    isLoading: boolean;
    onClick: () => void;
    style?: string;
  }) => (
    <button
      data-testid="load-more-button"
      onClick={onClick}
      disabled={isLoading}
      className={style}
    >
      {isLoading ? "Loading..." : "Load More"}
    </button>
  ),
}));

vi.mock("@/components/RepliesList", () => ({
  default: ({ parentId, postId }: { parentId: number; postId: string }) => (
    <div data-testid="replies-list">
      Replies for comment {parentId} in post {postId}
    </div>
  ),
}));

vi.mock("@/components/cards/Comment/CommentsLoading", () => ({
  default: () => <div data-testid="comments-loading">Loading comments...</div>,
}));

vi.mock("@/components/cards/Comment/CommentsError", () => ({
  default: ({ error, onRetry }: { error: Error; onRetry: () => void }) => (
    <div data-testid="comments-error">
      <span>Error: {error.message}</span>
      <button onClick={onRetry} data-testid="retry-button">
        Retry
      </button>
    </div>
  ),
}));

vi.mock("@/components/cards/Comment/CommentsEmpty", () => ({
  default: () => <div data-testid="comments-empty">No comments yet</div>,
}));

vi.mock("@/components/cards/Comment/CommentCardMenu", () => ({
  default: () => <div data-testid="comment-card-menu">Menu</div>,
}));

vi.mock("@/components/CommentForm", () => ({
  default: ({
    author,
    onSubmitStart,
  }: {
    author: string;
    onSubmitStart: () => void;
  }) => (
    <div data-testid="comment-form">
      <span>Reply to {author}</span>
      <button onClick={onSubmitStart}>Submit</button>
    </div>
  ),
}));

vi.mock("@/utils/dateFormatter.util", () => ({
  formatTimeAgo: vi.fn((date) => `${date} ago`),
}));

vi.mock("@/utils/getInitials.util", () => ({
  getInitials: vi.fn((name) => name.substring(0, 2).toUpperCase()),
}));

const mockUseNavigate = vi.mocked(useNavigate);
const mockUseParentCommentsQuery = vi.mocked(useParentCommentsQuery);
const mockUseAuthStore = vi.mocked(useAuthStore);

const mockUser = {
  id: "current-user",
  username: "current_user",
  email: "user@example.com",
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe("CommentCard Component", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseAuthStore.mockReturnValue({ user: mockUser });
  });

  afterEach(() => {
    cleanup();
  });

  describe("Authentication", () => {
    it("should not render anything when user is not authenticated", () => {
      mockUseAuthStore.mockReturnValue({ user: null });
      mockQueryStates(mockUseParentCommentsQuery, {
        data: {
          pages: mockQueryData.pages,
          pageParams: mockQueryData.pageParams,
        },
        isLoading: false,
      });

      const { container } = render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Loading State", () => {
    it("should render loading component when comments are loading", () => {
      mockQueryStates(mockUseParentCommentsQuery);

      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      expect(screen.getByTestId("comments-loading")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should render error component when there is an error", () => {
      const mockError = new Error("Failed to fetch comments");
      const mockRefetch = vi.fn();

      mockQueryStates(mockUseParentCommentsQuery, {
        isLoading: false,
        error: mockError,
        refetch: mockRefetch,
      });

      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      expect(screen.getByTestId("comments-error")).toBeInTheDocument();
      expect(
        screen.getByText("Error: Failed to fetch comments")
      ).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("retry-button"));
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Empty State", () => {
    it("should render empty component when there are no comments", () => {
      mockQueryStates(mockUseParentCommentsQuery, {
        data: {
          pages: [
            {
              data: [],
              pagination: {
                totalComments: 0,
                hasMore: false,
                nextCursor: null,
              },
            },
          ],
          pageParams: [null],
        },
        isLoading: false,
      });

      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      expect(screen.getByTestId("comments-empty")).toBeInTheDocument();
      expect(screen.getByText("Comments (0)")).toBeInTheDocument();
    });
  });

  describe("Success State", () => {
    beforeEach(() => {
      mockQueryStates(mockUseParentCommentsQuery, {
        data: {
          pages: mockQueryData.pages,
          pageParams: mockQueryData.pageParams,
        },
        isLoading: false,
      });
    });

    it("should render comments correctly", () => {
      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      expect(screen.getByText("Comments (2)")).toBeInTheDocument();

      expect(screen.getByText("This is the first comment")).toBeInTheDocument();
      expect(screen.getByText("john_doe")).toBeInTheDocument();
      expect(screen.getByText("2024-01-01 10:00:00 ago")).toBeInTheDocument();

      expect(
        screen.getByText("This is the second comment")
      ).toBeInTheDocument();
      expect(screen.getByText("jane_smith")).toBeInTheDocument();
      expect(
        screen.getByText("2024-01-01T11:00:00.000Z ago")
      ).toBeInTheDocument();

      expect(screen.getAllByText("Reply")).toHaveLength(2);
    });

    it("should render CommentCardMenu for each comment", () => {
      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      const menus = screen.getAllByTestId("comment-card-menu");
      expect(menus).toHaveLength(2);
    });

    it("should show view replies button for comments with replies", () => {
      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      expect(screen.getByText("View replies (2)")).toBeInTheDocument();
      expect(screen.queryByText("View replies (0)")).not.toBeInTheDocument();
    });

    it("should toggle replies visibility when view replies button is clicked", () => {
      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      const viewRepliesButton = screen.getByText("View replies (2)");

      // Initially replies should not be visible
      expect(screen.queryByTestId("replies-list")).not.toBeInTheDocument();

      // Click to show replies
      fireEvent.click(viewRepliesButton);
      expect(screen.getByTestId("replies-list")).toBeInTheDocument();
      expect(
        screen.getByText("Replies for comment 1 in post 123")
      ).toBeInTheDocument();
      expect(screen.getByText("Hide replies")).toBeInTheDocument();

      // Click to hide replies
      fireEvent.click(screen.getByText("Hide replies"));
      expect(screen.queryByTestId("replies-list")).not.toBeInTheDocument();
      expect(screen.getByText("View replies (2)")).toBeInTheDocument();
    });

    it("should navigate to user profile when username is clicked", async () => {
      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      const usernameButton = screen.getByText("john_doe");
      fireEvent.click(usernameButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/profile/user1");
      });
    });

    it("should render separators between comments", () => {
      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      const separators = screen.getAllByRole("separator");
      expect(separators).toHaveLength(1);
    });
  });

  describe("Reply Form Functionality", () => {
    beforeEach(() => {
      mockQueryStates(mockUseParentCommentsQuery, {
        data: {
          pages: mockQueryData.pages,
          pageParams: mockQueryData.pageParams,
        },
        isLoading: false,
      });
    });

    it("should show comment form when Reply button is clicked", () => {
      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      const replyButtons = screen.getAllByText("Reply");
      fireEvent.click(replyButtons[0]);

      expect(screen.getByText("Reply to john_doe")).toBeInTheDocument();
    });

    it("DEBUG: check if form renders at all", async () => {
      const { debug } = render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      const replyButtons = screen.getAllByText("Reply");
      fireEvent.click(replyButtons[0]);

      await waitFor(() => {
        debug(); // This will show the actual DOM after clicking
      });
    });

    it("should hide comment form when Reply button is clicked again", async () => {
      const { unmount } = render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      // Wait for initial render to complete
      await waitFor(() => {
        expect(screen.getByText("john_doe")).toBeInTheDocument();
      });

      const replyButtons = screen.getAllByText("Reply");

      // First click to open
      fireEvent.click(replyButtons[0]);

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByTestId("reply-form-1")).toBeInTheDocument();
      });

      // Second click to close
      fireEvent.click(replyButtons[0]);

      // Wait for form to disappear
      await waitFor(() => {
        expect(screen.queryByTestId("reply-form-1")).not.toBeInTheDocument();
      });

      unmount();
    });

    it("should allow multiple reply forms to be open simultaneously", () => {
      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      const replyButtons = screen.getAllByText("Reply");
      fireEvent.click(replyButtons[0]);
      fireEvent.click(replyButtons[1]);

      expect(screen.getByText("Reply to john_doe")).toBeInTheDocument();
      expect(screen.getByText("Reply to jane_smith")).toBeInTheDocument();
    });
  });

  describe("Load More Functionality", () => {
    it("should show load more button when hasNextPage is true", () => {
      const mockFetchNextPage = vi.fn();

      mockQueryStates(mockUseParentCommentsQuery, {
        data: {
          pages: mockQueryDataWithMore.pages,
          pageParams: mockQueryDataWithMore.pageParams,
        },
        isLoading: false,
        hasNextPage: true,
        fetchNextPage: mockFetchNextPage,
        isFetchingNextPage: false,
      });

      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      const loadMoreButton = screen.getByTestId("load-more-button");
      expect(loadMoreButton).toBeInTheDocument();
      expect(loadMoreButton).not.toBeDisabled();

      fireEvent.click(loadMoreButton);
      expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
    });

    it("should show loading state on load more button when fetching", () => {
      mockQueryStates(mockUseParentCommentsQuery, {
        data: {
          pages: mockQueryDataWithMore.pages,
          pageParams: mockQueryDataWithMore.pageParams,
        },
        isLoading: false,
        hasNextPage: true,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: true,
      });

      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      const loadMoreButton = screen.getByTestId("load-more-button");
      expect(loadMoreButton).toBeDisabled();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should not show load more button when hasNextPage is false", () => {
      mockQueryStates(mockUseParentCommentsQuery, {
        data: {
          pages: mockQueryData.pages,
          pageParams: mockQueryData.pageParams,
        },
        isLoading: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
      });

      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      expect(screen.queryByTestId("load-more-button")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined data gracefully", () => {
      mockQueryStates(mockUseParentCommentsQuery, {
        data: undefined,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      expect(screen.getByText("Comments (0)")).toBeInTheDocument();
      expect(screen.getByTestId("comments-empty")).toBeInTheDocument();
    });

    it("should handle empty pages gracefully", () => {
      mockQueryStates(mockUseParentCommentsQuery, {
        data: { pages: [], pageParams: [null] },
        isLoading: false,
      });

      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      expect(screen.getByText("Comments (0)")).toBeInTheDocument();
      expect(screen.getByTestId("comments-empty")).toBeInTheDocument();
    });

    it("should handle comments without replies correctly", () => {
      const commentsWithoutReplies = [
        {
          ...mockComments[0],
          totalReplies: 0,
        },
      ];

      mockQueryStates(mockUseParentCommentsQuery, {
        data: {
          pages: [
            {
              data: commentsWithoutReplies,
              pagination: {
                totalComments: 1,
                hasMore: false,
                nextCursor: null,
              },
            },
          ],
          pageParams: [null],
        },
        isLoading: false,
      });

      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      expect(screen.getByText("This is the first comment")).toBeInTheDocument();
      expect(screen.queryByText("View replies")).not.toBeInTheDocument();
    });

    it("should handle multiple replies toggle independently", () => {
      const commentsWithReplies = mockComments.map((comment) => ({
        ...comment,
        totalReplies: 1,
      }));

      mockQueryStates(mockUseParentCommentsQuery, {
        data: {
          pages: [
            {
              data: commentsWithReplies,
              pagination: {
                totalComments: 2,
                hasMore: false,
                nextCursor: null,
              },
            },
          ],
          pageParams: [null],
        },
        isLoading: false,
      });

      render(
        <TestWrapper>
          <CommentCard postId="123" />
        </TestWrapper>
      );

      const viewRepliesButtons = screen.getAllByText(/View replies/);
      expect(viewRepliesButtons).toHaveLength(2);

      // Click first comment's replies
      fireEvent.click(viewRepliesButtons[0]);
      expect(
        screen.getByText("Replies for comment 1 in post 123")
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Replies for comment 2 in post 123")
      ).not.toBeInTheDocument();

      // Click second comment's replies
      fireEvent.click(viewRepliesButtons[1]);
      expect(
        screen.getByText("Replies for comment 1 in post 123")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Replies for comment 2 in post 123")
      ).toBeInTheDocument();
    });
  });
});
