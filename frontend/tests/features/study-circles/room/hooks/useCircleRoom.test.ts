import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── hoisted mocks ─────────────────────────────────────────────────────────────

const mockSetCurrentUser = vi.hoisted(() => vi.fn());
const mockSelectCircle = vi.hoisted(() => vi.fn());
const mockFetchNextPage = vi.hoisted(() => vi.fn());
const mockMutateAsync = vi.hoisted(() => vi.fn());

const mockCircleStore = vi.hoisted(() => ({
  selectedCircleId: "circle-1",
  selectCircle: mockSelectCircle,
  setCurrentUser: mockSetCurrentUser,
}));

const mockCurrentUser = vi.hoisted(() => ({
  id: "user-me",
  username: "alice",
  avatar: null,
}));

const mockCircleData = vi.hoisted(() => ({
  groups: [],
  selectedCircle: null,
  members: [],
  messages: [],
  isLoadingCircles: false,
  isLoadingMembers: false,
  isLoadingMessages: false,
  isFetchingNextPage: false,
  pagination: {
    hasNextPage: false,
    fetchNextPage: mockFetchNextPage,
  },
}));

vi.mock("@/stores/circle.store", () => ({
  useCircleStore: vi.fn(() => mockCircleStore),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: vi.fn((selector: (state: any) => any) =>
    selector({ user: mockCurrentUser }),
  ),
}));

vi.mock("@/queries/circle", () => ({
  useSendCircleMessageMutation: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

vi.mock("@/features/study-circles/room/hooks/useCircleData", () => ({
  useCircleData: vi.fn(() => mockCircleData),
}));

vi.mock("@/features/study-circles/room/hooks/useCirclePresence", () => ({
  useCirclePresence: vi.fn(),
}));

vi.mock("@/features/study-circles/room/hooks/useCircleSync", () => ({
  useCircleSync: vi.fn(),
}));

import { useCircleRoom } from "@/features/study-circles/room/hooks/useCircleRoom";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeMember(
  userId: string,
  isMuted = false,
): { userId: string; isMuted: boolean; user: { id: string } } {
  return { userId, isMuted, user: { id: userId } } as any;
}

function render() {
  return renderHook(() => useCircleRoom());
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("useCircleRoom hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset store mock
    mockCircleStore.selectedCircleId = "circle-1";
    mockCircleStore.selectCircle = mockSelectCircle;
    mockCircleStore.setCurrentUser = mockSetCurrentUser;

    // Reset circle data mock
    mockCircleData.groups = [];
    mockCircleData.selectedCircle = null;
    mockCircleData.members = [];
    mockCircleData.messages = [];
    mockCircleData.isLoadingCircles = false;
    mockCircleData.isLoadingMembers = false;
    mockCircleData.isLoadingMessages = false;
    mockCircleData.isFetchingNextPage = false;
    mockCircleData.pagination = {
      hasNextPage: false,
      fetchNextPage: mockFetchNextPage,
    };
  });

  // ── auth integration ────────────────────────────────────────────────────────

  describe("auth integration", () => {
    it("calls setCurrentUser with the current user on mount", () => {
      render();
      expect(mockSetCurrentUser).toHaveBeenCalledWith(mockCurrentUser);
    });

    it("calls setCurrentUser exactly once on initial mount", () => {
      render();
      expect(mockSetCurrentUser).toHaveBeenCalledTimes(1);
    });

    it("exposes currentUser from the auth store", () => {
      const { result } = render();
      expect(result.current.currentUser).toEqual(mockCurrentUser);
    });

    it("does not call setCurrentUser when currentUser is null", async () => {
      const { useAuthStore } = vi.mocked(await import("@/stores/auth.store"));
      (useAuthStore as ReturnType<typeof vi.fn>).mockImplementationOnce(
        (selector: (state: any) => any) => selector({ user: null }),
      );

      render();
      expect(mockSetCurrentUser).not.toHaveBeenCalled();
    });
  });

  // ── muting logic ────────────────────────────────────────────────────────────

  describe("muting logic", () => {
    it("returns isMuted true when the current user is muted", () => {
      mockCircleData.members = [makeMember("user-me", true)] as any;
      const { result } = render();
      expect(result.current.isMuted).toBe(true);
    });

    it("returns isMuted false when the current user is not muted", () => {
      mockCircleData.members = [makeMember("user-me", false)] as any;
      const { result } = render();
      expect(result.current.isMuted).toBe(false);
    });

    it("returns isMuted false when the current user is not in the members list", () => {
      mockCircleData.members = [makeMember("user-other", false)] as any;
      const { result } = render();
      expect(result.current.isMuted).toBe(false);
    });

    it("returns isMuted false when members list is empty", () => {
      mockCircleData.members = [];
      const { result } = render();
      expect(result.current.isMuted).toBe(false);
    });

    it("does not call mutateAsync when the user is muted", async () => {
      mockCircleData.members = [makeMember("user-me", true)] as any;
      const { result } = render();

      await act(async () => {
        await result.current.handleSendMessage("Hello!");
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  // ── message submission ──────────────────────────────────────────────────────

  describe("message submission", () => {
    it("calls mutateAsync with correct payload for valid message", async () => {
      mockMutateAsync.mockResolvedValue({});
      const { result } = render();

      await act(async () => {
        await result.current.handleSendMessage("Hello world");
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({ content: "Hello world" });
    });

    it("calls mutateAsync exactly once per send", async () => {
      mockMutateAsync.mockResolvedValue({});
      const { result } = render();

      await act(async () => {
        await result.current.handleSendMessage("Hi");
      });

      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });

    it("does not call mutateAsync for an empty string", async () => {
      const { result } = render();

      await act(async () => {
        await result.current.handleSendMessage("");
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("does not call mutateAsync for a whitespace-only string", async () => {
      const { result } = render();

      await act(async () => {
        await result.current.handleSendMessage("   ");
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("does not call mutateAsync when selectedCircleId is null", async () => {
      mockCircleStore.selectedCircleId = null as any;
      const { result } = render();

      await act(async () => {
        await result.current.handleSendMessage("Hello");
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("trims content before checking but sends the original trimmed content", async () => {
      mockMutateAsync.mockResolvedValue({});
      const { result } = render();

      await act(async () => {
        await result.current.handleSendMessage("  Hello  ");
      });

      // content.trim() is used only to validate; raw content is passed
      expect(mockMutateAsync).toHaveBeenCalledWith({ content: "  Hello  " });
    });
  });

  // ── pagination handoff ──────────────────────────────────────────────────────

  describe("pagination handoff", () => {
    it("calls fetchNextPage when hasNextPage is true and not already fetching", () => {
      mockCircleData.pagination = {
        hasNextPage: true,
        fetchNextPage: mockFetchNextPage,
      };
      mockCircleData.isFetchingNextPage = false;
      const { result } = render();

      act(() => {
        result.current.handleLoadMore();
      });

      expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
    });

    it("does not call fetchNextPage when hasNextPage is false", () => {
      mockCircleData.pagination = {
        hasNextPage: false,
        fetchNextPage: mockFetchNextPage,
      };
      mockCircleData.isFetchingNextPage = false;
      const { result } = render();

      act(() => {
        result.current.handleLoadMore();
      });

      expect(mockFetchNextPage).not.toHaveBeenCalled();
    });

    it("does not call fetchNextPage when isFetchingNextPage is true", () => {
      mockCircleData.pagination = {
        hasNextPage: true,
        fetchNextPage: mockFetchNextPage,
      };
      mockCircleData.isFetchingNextPage = true;
      const { result } = render();

      act(() => {
        result.current.handleLoadMore();
      });

      expect(mockFetchNextPage).not.toHaveBeenCalled();
    });

    it("does not call fetchNextPage when both hasNextPage is false and isFetchingNextPage is true", () => {
      mockCircleData.pagination = {
        hasNextPage: false,
        fetchNextPage: mockFetchNextPage,
      };
      mockCircleData.isFetchingNextPage = true;
      const { result } = render();

      act(() => {
        result.current.handleLoadMore();
      });

      expect(mockFetchNextPage).not.toHaveBeenCalled();
    });

    it("exposes hasNextPage from pagination", () => {
      mockCircleData.pagination = {
        hasNextPage: true,
        fetchNextPage: mockFetchNextPage,
      };
      const { result } = render();
      expect(result.current.hasNextPage).toBe(true);
    });

    it("exposes hasNextPage as false when pagination has no more pages", () => {
      mockCircleData.pagination = {
        hasNextPage: false,
        fetchNextPage: mockFetchNextPage,
      };
      const { result } = render();
      expect(result.current.hasNextPage).toBe(false);
    });
  });

  // ── return shape ────────────────────────────────────────────────────────────

  describe("return shape", () => {
    it("exposes selectedCircleId from the circle store", () => {
      const { result } = render();
      expect(result.current.selectedCircleId).toBe("circle-1");
    });

    it("exposes handleSelectCircle as selectCircle from the store", () => {
      const { result } = render();
      expect(result.current.handleSelectCircle).toBe(mockSelectCircle);
    });

    it("exposes loading flags from useCircleData", () => {
      mockCircleData.isLoadingCircles = true;
      mockCircleData.isLoadingMembers = true;
      mockCircleData.isLoadingMessages = true;
      const { result } = render();

      expect(result.current.isLoadingCircles).toBe(true);
      expect(result.current.isLoadingMembers).toBe(true);
      expect(result.current.isLoadingMessages).toBe(true);
    });

    it("exposes members from useCircleData", () => {
      const members = [makeMember("user-1"), makeMember("user-2")];
      mockCircleData.members = members as any;
      const { result } = render();
      expect(result.current.members).toHaveLength(2);
    });
  });
});
