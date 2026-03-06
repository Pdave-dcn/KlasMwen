import React from "react";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { RecentActivitySection } from "@/features/study-circles/hub/components/RecentActivity/RecentActivitySection";
import { usePresenceStore } from "@/stores/presence.store";
import { useRecentActivityCirclesQuery } from "@/queries/circle";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("@/queries/circle");
vi.mock("@/features/study-circles/hub/hooks/useCirclesPresenceCount", () => ({
  useCirclesPresenceCount: vi.fn(),
}));

const mockUseRecent = vi.mocked(useRecentActivityCirclesQuery);

function createWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("RecentActivitySection integration with presence store", () => {
  const circles = [
    { id: "1", name: "Circle 1", avatar: null, latestMessage: null },
    { id: "2", name: "Circle 2", avatar: null, latestMessage: null },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRecent.mockReturnValue({
      data: circles as any,
      isLoading: false,
      isError: false,
    } as any);

    // reset store counts
    usePresenceStore.setState({ circleActivityCounts: {} });
  });

  it("Initial render shows cards but no presence text", () => {
    render(<RecentActivitySection />, { wrapper: createWrapper });

    expect(screen.getByText("Circle 1")).toBeInTheDocument();
    expect(screen.getByText("Circle 2")).toBeInTheDocument();

    expect(screen.queryByText(/students active/i)).not.toBeInTheDocument();
  });

  it("Reactive store update adds activity count and indicator", () => {
    const { container } = render(<RecentActivitySection />, {
      wrapper: createWrapper,
    });

    act(() => {
      usePresenceStore.setState({ circleActivityCounts: { "1": 5 } });
    });

    expect(screen.getByText("5 students active")).toBeInTheDocument();
    // there should be a green dot with the appropriate utility class
    expect(container.querySelector(".bg-emerald-500")).toBeInTheDocument();
  });

  it("Hides indicator if count returns to zero", () => {
    render(<RecentActivitySection />, { wrapper: createWrapper });

    act(() => {
      usePresenceStore.setState({ circleActivityCounts: { "1": 1 } });
    });
    expect(screen.getByText("1 student active")).toBeInTheDocument();

    act(() => {
      usePresenceStore.setState({ circleActivityCounts: { "1": 0 } });
    });
    expect(screen.queryByText(/student active/i)).not.toBeInTheDocument();
  });

  it("Singular/plural logic updates correctly", () => {
    render(<RecentActivitySection />, { wrapper: createWrapper });

    act(() => {
      usePresenceStore.setState({ circleActivityCounts: { "1": 1 } });
    });
    expect(screen.getByText("1 student active")).toBeInTheDocument();

    act(() => {
      usePresenceStore.setState({ circleActivityCounts: { "1": 2 } });
    });
    expect(screen.getByText("2 students active")).toBeInTheDocument();
  });
});
