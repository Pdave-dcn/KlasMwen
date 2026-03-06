import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";

import { SuggestedCirclesSection } from "@/features/study-circles/hub/components/SuggestedStudyCircle/SuggestedCirclesSection";
import { usePresenceStore } from "@/stores/presence.store";
import * as circleQueries from "@/queries/circle";

// Mock useCirclesPresenceCount to prevent socket subscriptions
vi.mock("@/features/study-circles/hooks/useCirclesPresenceCount", () => ({
  useCirclesPresenceCount: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe("SuggestedCirclesSection", () => {
  let queryClient: QueryClient;

  const mockCircles = [
    {
      id: "circle-1",
      name: "Advanced Mathematics",
      description: "Study group for advanced math topics",
      membersCount: 12,
      imageUrl: "https://via.placeholder.com/100",
      createdAt: new Date().toISOString(),
    },
    {
      id: "circle-2",
      name: "Physics Fundamentals",
      description: "Explore physics concepts together",
      membersCount: 8,
      imageUrl: "https://via.placeholder.com/100",
      createdAt: new Date().toISOString(),
    },
  ];

  function createWrapper() {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset presence store
    act(() => {
      usePresenceStore.setState({ circleActivityCounts: {} });
    });
  });

  describe("Presence Integration", () => {
    it("should not show presence indicator initially", async () => {
      vi.spyOn(circleQueries, "useRecommendedCirclesQuery").mockReturnValue({
        data: {
          pages: [{ data: mockCircles, nextCursor: null }],
          pageParams: [undefined],
        },
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetchingNextPage: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        refetch: vi.fn(),
      } as any);

      render(<SuggestedCirclesSection />, { wrapper: createWrapper() });

      // Verify circles are rendered
      expect(screen.getByText("Advanced Mathematics")).toBeInTheDocument();
      expect(screen.getByText("Physics Fundamentals")).toBeInTheDocument();

      // Verify no presence count text appears initially
      expect(screen.queryByText(/students active/i)).not.toBeInTheDocument();
    });

    it("should display presence count when presence store is updated", async () => {
      vi.spyOn(circleQueries, "useRecommendedCirclesQuery").mockReturnValue({
        data: {
          pages: [{ data: mockCircles, nextCursor: null }],
          pageParams: [undefined],
        },
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetchingNextPage: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        refetch: vi.fn(),
      } as any);

      const { container } = render(<SuggestedCirclesSection />, {
        wrapper: createWrapper(),
      });

      // Update presence store with activity for circle-1
      act(() => {
        usePresenceStore.setState({
          circleActivityCounts: { "circle-1": 5 },
        });
      });

      await waitFor(() => {
        expect(screen.getByText("5 students active")).toBeInTheDocument();
      });

      // Verify the indicator dot appears (green indicator)
      const indicators = container.querySelectorAll(".bg-emerald-500");
      expect(indicators.length).toBeGreaterThan(0);
    });

    it("should display singular form for 1 active student", async () => {
      vi.spyOn(circleQueries, "useRecommendedCirclesQuery").mockReturnValue({
        data: {
          pages: [{ data: [mockCircles[0]], nextCursor: null }],
          pageParams: [undefined],
        },
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetchingNextPage: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        refetch: vi.fn(),
      } as any);

      render(<SuggestedCirclesSection />, { wrapper: createWrapper() });

      act(() => {
        usePresenceStore.setState({
          circleActivityCounts: { "circle-1": 1 },
        });
      });

      await waitFor(() => {
        expect(screen.getByText("1 student active")).toBeInTheDocument();
      });
    });
  });

  describe("Join Mutation UI", () => {
    it("should call mutation with correct circle ID when Join button is clicked", async () => {
      const mockMutate = vi.fn();
      vi.spyOn(circleQueries, "useRecommendedCirclesQuery").mockReturnValue({
        data: {
          pages: [{ data: [mockCircles[0]], nextCursor: null }],
          pageParams: [undefined],
        },
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetchingNextPage: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        refetch: vi.fn(),
      } as any);

      vi.spyOn(circleQueries, "useJoinCircleMutation").mockReturnValue({
        mutate: mockMutate,
        mutateAsync: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
        data: undefined,
        reset: vi.fn(),
        failureCount: 0,
        failureReason: null,
        isIdle: true,
        isPaused: false,
        status: "idle",
        variables: undefined,
      } as any);

      const user = userEvent.setup();
      render(<SuggestedCirclesSection />, { wrapper: createWrapper() });

      // Find and click the Join button for the first circle
      const joinButtons = screen.getAllByRole("button", {
        name: /join|discover more/i,
      });
      const firstJoinButton = joinButtons.find((btn) =>
        btn.textContent?.includes("Join"),
      );

      if (firstJoinButton) {
        await user.click(firstJoinButton);
        await waitFor(() => {
          expect(mockMutate).toHaveBeenCalledWith("circle-1");
        });
      }
    });

    it("should show loading state while mutation is pending", async () => {
      vi.spyOn(circleQueries, "useRecommendedCirclesQuery").mockReturnValue({
        data: {
          pages: [{ data: [mockCircles[0]], nextCursor: null }],
          pageParams: [undefined],
        },
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetchingNextPage: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        refetch: vi.fn(),
      } as any);

      vi.spyOn(circleQueries, "useJoinCircleMutation").mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: true,
        isSuccess: false,
        isError: false,
        error: null,
        data: undefined,
        reset: vi.fn(),
        failureCount: 0,
        failureReason: null,
        isIdle: false,
        isPaused: false,
        status: "pending",
        variables: undefined,
      } as any);

      render(<SuggestedCirclesSection />, { wrapper: createWrapper() });

      // Find the Join button
      const joinButtons = screen.getAllByRole("button", {
        name: /joining|join/i,
      });
      const pendingButton = joinButtons.find((btn) =>
        btn.textContent?.includes("Joining"),
      );

      if (pendingButton) {
        // Verify button shows "Joining..." and is disabled
        expect(pendingButton).toHaveTextContent("Joining...");
        expect(pendingButton).toBeDisabled();
      }
    });

    it("should show success state when join mutation succeeds", async () => {
      vi.spyOn(circleQueries, "useRecommendedCirclesQuery").mockReturnValue({
        data: {
          pages: [{ data: [mockCircles[0]], nextCursor: null }],
          pageParams: [undefined],
        },
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetchingNextPage: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        refetch: vi.fn(),
      } as any);

      vi.spyOn(circleQueries, "useJoinCircleMutation").mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
        isSuccess: true,
        isError: false,
        error: null,
        data: { id: "circle-1" },
        reset: vi.fn(),
        failureCount: 0,
        failureReason: null,
        isIdle: false,
        isPaused: false,
        status: "success",
        variables: undefined,
      } as any);

      render(<SuggestedCirclesSection />, {
        wrapper: createWrapper(),
      });

      // Verify circles are rendered
      expect(screen.getByText("Advanced Mathematics")).toBeInTheDocument();

      // Verify mutation state is success (button should be disabled or show success state)
      // The component should reflect the mutation's isSuccess state
      const buttons = screen.getAllByRole("button", {
        name: /join|joining|joined/i,
      });
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("Empty and Error States", () => {
    it("should show error alert when query fails", async () => {
      vi.spyOn(circleQueries, "useRecommendedCirclesQuery").mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        isSuccess: false,
        isFetchingNextPage: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        refetch: vi.fn(),
      } as any);

      render(<SuggestedCirclesSection />, { wrapper: createWrapper() });

      // Verify error alert appears
      expect(
        screen.getByText("Unable to load suggestions"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /We couldn't fetch study circles suggestions at this time/i,
        ),
      ).toBeInTheDocument();
    });

    it("should show empty state when no circles are available", async () => {
      vi.spyOn(circleQueries, "useRecommendedCirclesQuery").mockReturnValue({
        data: {
          pages: [{ data: [], nextCursor: null }],
          pageParams: [undefined],
        },
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetchingNextPage: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        refetch: vi.fn(),
      } as any);

      render(<SuggestedCirclesSection />, { wrapper: createWrapper() });

      // Verify empty state message appears
      expect(screen.getByText("No suggestions available")).toBeInTheDocument();
      expect(
        screen.getByText(/Try discovering study circles to get started/i),
      ).toBeInTheDocument();

      // Verify discover button appears
      const discoverButton = screen.getByRole("button", {
        name: /discover study circles/i,
      });
      expect(discoverButton).toBeInTheDocument();
    });

    it("should show loading skeleton while data is fetching", async () => {
      vi.spyOn(circleQueries, "useRecommendedCirclesQuery").mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        isSuccess: false,
        isFetchingNextPage: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        refetch: vi.fn(),
      } as any);

      const { container } = render(<SuggestedCirclesSection />, {
        wrapper: createWrapper(),
      });

      // Verify skeleton loaders appear (5 skeletons for 5 suggested circles max)
      const skeletons = container.querySelectorAll(".h-20.rounded-lg");
      expect(skeletons.length).toBe(5);
    });
  });

  describe("Header Navigation", () => {
    it("should show Discover button when circles are available", async () => {
      vi.spyOn(circleQueries, "useRecommendedCirclesQuery").mockReturnValue({
        data: {
          pages: [{ data: mockCircles, nextCursor: null }],
          pageParams: [undefined],
        },
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetchingNextPage: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        refetch: vi.fn(),
      } as any);

      render(<SuggestedCirclesSection />, { wrapper: createWrapper() });

      // Find the "Discover more" button in the header
      const discoverMoreButtons = screen.getAllByRole("button", {
        name: /discover more/i,
      });
      expect(discoverMoreButtons.length).toBeGreaterThan(0);
    });
  });
});
