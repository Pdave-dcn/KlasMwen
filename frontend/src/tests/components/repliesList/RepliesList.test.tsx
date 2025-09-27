import { BrowserRouter, useNavigate } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import RepliesList from "@/components/RepliesList";
import { useRepliesQuery } from "@/queries/useComment";

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

const mockUseNavigate = vi.mocked(useNavigate);
const mockUseRepliesQuery = vi.mocked(useRepliesQuery);

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
  });

  describe("Loading State", () => {
    it("should render the spinner when replies are loading", () => {
      mockQueryStates(mockUseRepliesQuery, {
        isLoading: true,
      });

      render(
        <TestWrapper>
          <RepliesList parentId={1} />
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
          <RepliesList parentId={1} />
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
          <RepliesList parentId={1} />
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
          <RepliesList parentId={1} />
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
          <RepliesList parentId={1} />
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
          <RepliesList parentId={1} />
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
          <RepliesList parentId={1} />
        </TestWrapper>
      );

      const separators = screen.getAllByRole("separator");
      expect(separators).toHaveLength(1);
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
          <RepliesList parentId={1} />
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
          <RepliesList parentId={1} />
        </TestWrapper>
      );

      const janeButton = screen.getByRole("button", { name: "jane_smith" });
      fireEvent.click(janeButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/profile/user2");
      });
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
          <RepliesList parentId={1} />
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
          <RepliesList parentId={1} />
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
          <RepliesList parentId={1} />
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
          <RepliesList parentId={1} />
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
          <RepliesList parentId={parentId} />
        </TestWrapper>
      );

      expect(mockUseRepliesQuery).toHaveBeenCalledWith(parentId);
    });
  });
});
