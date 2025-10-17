import { BrowserRouter, useNavigate } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import RepliesList from "@/components/RepliesList";
import { useRepliesQuery } from "@/queries/useComment";
import { useAuthStore } from "@/stores/auth.store";

import { mockQueryStates, mockQueryData, mockQueryDataWithMore } from "./mocks";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock("@/queries/useComment", () => ({
  useRepliesQuery: vi.fn(),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("@/components/LoadMoreButton", () => ({
  default: ({
    isLoading,
    onClick,
    variant,
  }: {
    isLoading: boolean;
    onClick: () => void;
    variant?: string;
  }) => (
    <button
      data-testid="load-more-button"
      onClick={onClick}
      disabled={isLoading}
      className={variant}
    >
      {isLoading ? "Loading..." : "Load More"}
    </button>
  ),
}));

vi.mock("@/components/ui/spinner", () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}));

vi.mock("@/utils/dateFormatter.util", () => ({
  formatTimeAgo: vi.fn((date) => `${date} ago`),
}));

vi.mock("@/utils/getInitials.util", () => ({
  getInitials: vi.fn((name) => name.substring(0, 2).toUpperCase()),
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

const mockUseNavigate = vi.mocked(useNavigate);
const mockUseRepliesQuery = vi.mocked(useRepliesQuery);
const mockUseAuthStore = vi.mocked(useAuthStore);

const mockUser = {
  id: "current-user",
  username: "current_user",
  email: "user@example.com",
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

describe("RepliesList Component", () => {
  const mockNavigate = vi.fn();
  const mockRefetch = vi.fn();
  const mockFetchNextPage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseAuthStore.mockReturnValue({ user: mockUser });
  });

  describe("Authentication", () => {
    it("should not render anything when user is not authenticated", () => {
      mockUseAuthStore.mockReturnValue({ user: null });
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        data: mockQueryData,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      const { container } = render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
        </TestWrapper>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Loading State", () => {
    it("should render the spinner when replies are loading", () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: true,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
        </TestWrapper>
      );

      expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should render error message and retry button when there's an error", () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        error: new Error("Failed to fetch"),
        refetch: mockRefetch,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
        </TestWrapper>
      );

      expect(screen.getByText("Failed to load replies")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });
  });

  describe("Success State - Replies Rendering", () => {
    it("should render replies when data is loaded successfully", () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        data: mockQueryData,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
        </TestWrapper>
      );

      expect(screen.getByText("This is the first reply")).toBeInTheDocument();
      expect(screen.getByText("This is the second reply")).toBeInTheDocument();
    });

    it("should render user avatars and usernames", () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        data: mockQueryData,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
        </TestWrapper>
      );

      expect(screen.getByText("john_doe")).toBeInTheDocument();
      expect(screen.getByText("jane_smith")).toBeInTheDocument();
    });

    it("should render formatted timestamps", () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        data: mockQueryData,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
        </TestWrapper>
      );

      expect(screen.getByText("2024-01-01 10:00:00 ago")).toBeInTheDocument();
      expect(screen.getByText("2024-01-01 11:00:00 ago")).toBeInTheDocument();
    });

    it("should render Reply buttons for each reply", () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        data: mockQueryData,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
        </TestWrapper>
      );

      const replyButtons = screen.getAllByText("Reply");
      expect(replyButtons).toHaveLength(2);
    });

    it("should render separators between replies except for the last one", () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        data: mockQueryData,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
        </TestWrapper>
      );

      const separators = screen.getAllByRole("separator");
      expect(separators).toHaveLength(1);
    });

    it("should render CommentCardMenu for each reply", () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        data: mockQueryData,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
        </TestWrapper>
      );

      const menus = screen.getAllByTestId("comment-card-menu");
      expect(menus).toHaveLength(2);
    });
  });

  describe("User Navigation", () => {
    it("should navigate to user profile when username is clicked", async () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        data: mockQueryData,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
        </TestWrapper>
      );

      const userButton = screen.getByRole("button", { name: "john_doe" });
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/profile/user1");
      });
    });

    it("should navigate to correct user profile for different users", async () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        data: mockQueryData,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
        </TestWrapper>
      );

      const janeButton = screen.getByRole("button", { name: "jane_smith" });
      fireEvent.click(janeButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/profile/user2");
      });
    });
  });

  describe("Reply Form Functionality", () => {
    it("should show comment form when Reply button is clicked", () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        data: mockQueryData,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
        </TestWrapper>
      );

      const replyButtons = screen.getAllByText("Reply");
      fireEvent.click(replyButtons[0]);

      expect(screen.getByText("Reply to john_doe")).toBeInTheDocument();
    });

    it("should hide comment form when Reply button is clicked again", () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        data: mockQueryData,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
        </TestWrapper>
      );

      const replyButtons = screen.getAllByText("Reply");
      fireEvent.click(replyButtons[0]);
      expect(screen.getByText("Reply to john_doe")).toBeInTheDocument();

      fireEvent.click(replyButtons[0]);
      expect(screen.queryByText("Reply to john_doe")).not.toBeInTheDocument();
    });

    it("should allow multiple reply forms to be open simultaneously", () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        data: mockQueryData,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
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
    it("should render Load More button when hasNextPage is true", () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        data: mockQueryDataWithMore,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage: mockFetchNextPage,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
        </TestWrapper>
      );

      expect(screen.getByTestId("load-more-button")).toBeInTheDocument();
      expect(screen.getByText("Load More")).toBeInTheDocument();
    });

    it("should not render Load More button when hasNextPage is false", () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        data: mockQueryData,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
        </TestWrapper>
      );

      expect(screen.queryByTestId("load-more-button")).not.toBeInTheDocument();
    });

    it("should call fetchNextPage when Load More button is clicked", () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        data: mockQueryDataWithMore,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage: mockFetchNextPage,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
        </TestWrapper>
      );

      const loadMoreButton = screen.getByTestId("load-more-button");
      fireEvent.click(loadMoreButton);

      expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
    });

    it("should show loading state on Load More button when isFetchingNextPage is true", () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        data: mockQueryDataWithMore,
        hasNextPage: true,
        isFetchingNextPage: true,
        fetchNextPage: mockFetchNextPage,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} postId="post123" />
        </TestWrapper>
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("Component Props", () => {
    it("should call useRepliesQuery with the correct parentId", () => {
      const parentId = 123;

      mockQueryStates(mockUseRepliesQuery, {
        isLoading: false,
        data: mockQueryData,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={parentId} postId="post123" />
        </TestWrapper>
      );

      expect(mockUseRepliesQuery).toHaveBeenCalledWith(parentId);
    });
  });
});
