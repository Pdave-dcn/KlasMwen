import { BrowserRouter, useNavigate } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import CommentCard from "@/components/cards/Comment/CommentCard";
import { useParentCommentsQuery } from "@/queries/useComment";

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

vi.mock("@/queries/useComment", () => ({
  useParentCommentsQuery: vi.fn(),
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
  default: ({ parentId }: { parentId: number }) => (
    <div data-testid="replies-list">Replies for comment {parentId}</div>
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

vi.mock("@/utils/dateFormatter.util", () => ({
  formatTimeAgo: vi.fn((date) => `${date} ago`),
}));

vi.mock("@/utils/getInitials.util", () => ({
  getInitials: vi.fn((name) => name.substring(0, 2).toUpperCase()),
}));

const mockUseNavigate = vi.mocked(useNavigate);
const mockUseParentCommentsQuery = vi.mocked(useParentCommentsQuery);

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

describe("CommentCard Component", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
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
      expect(screen.getByText("Replies for comment 1")).toBeInTheDocument();
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
      expect(screen.getByText("Replies for comment 1")).toBeInTheDocument();
      expect(
        screen.queryByText("Replies for comment 2")
      ).not.toBeInTheDocument();

      // Click second comment's replies
      fireEvent.click(viewRepliesButtons[1]);
      expect(screen.getByText("Replies for comment 1")).toBeInTheDocument();
      expect(screen.getByText("Replies for comment 2")).toBeInTheDocument();
    });
  });
});
