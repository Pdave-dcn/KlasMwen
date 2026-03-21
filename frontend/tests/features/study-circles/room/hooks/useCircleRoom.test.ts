import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── hoisted mocks ─────────────────────────────────────────────────────────────

const mockSetCurrentUser = vi.hoisted(() => vi.fn());
const mockSelectCircle = vi.hoisted(() => vi.fn());
const mockSetCurrentUserMemberRole = vi.hoisted(() => vi.fn());
const mockFetchNextPage = vi.hoisted(() => vi.fn());
const mockMutateAsync = vi.hoisted(() => vi.fn());

const mockCircleStore = vi.hoisted(() => ({
  selectedCircleId: "circle-1",
  selectCircle: mockSelectCircle,
  setCurrentUser: mockSetCurrentUser,
  setCurrentUserMemberRole: mockSetCurrentUserMemberRole,
}));

const mockCurrentUser = vi.hoisted(() => ({
  id: "user-me",
  username: "alice",
  avatar: null,
}));

const mockCircleData = vi.hoisted(() => ({
  data: {
    circles: [],
    selectedCircle: null,
    members: [],
    messages: [],
  },
  loading: {
    circles: false,
    circle: false,
    members: false,
    messages: false,
  },
  pagination: {
    messages: {
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
    },
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

    mockCircleStore.selectedCircleId = "circle-1";
    mockCircleStore.selectCircle = mockSelectCircle;
    mockCircleStore.setCurrentUser = mockSetCurrentUser;
    mockCircleStore.setCurrentUserMemberRole = mockSetCurrentUserMemberRole;

    mockCircleData.data.circles = [];
    mockCircleData.data.selectedCircle = null;
    mockCircleData.data.members = [];
    mockCircleData.data.messages = [];
    mockCircleData.loading.circles = false;
    mockCircleData.loading.circle = false;
    mockCircleData.loading.members = false;
    mockCircleData.loading.messages = false;
    mockCircleData.pagination.messages.hasNextPage = false;
    mockCircleData.pagination.messages.isFetchingNextPage = false;
    mockCircleData.pagination.messages.fetchNextPage = mockFetchNextPage;
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

  // ── member role sync ───────────────────────────────────────────────────────

  describe("member role sync", () => {
    it("calls setCurrentUserMemberRole with userRole when selectedCircle changes", () => {
      mockCircleData.data.selectedCircle = { userRole: "MODERATOR" } as any;
      render();
      expect(mockSetCurrentUserMemberRole).toHaveBeenCalledWith("MODERATOR");
    });

    it("calls setCurrentUserMemberRole with null when selectedCircle is null", () => {
      mockCircleData.data.selectedCircle = null;
      render();
      expect(mockSetCurrentUserMemberRole).toHaveBeenCalledWith(null);
    });
  });

  // ── muting logic ────────────────────────────────────────────────────────────

  describe("muting logic", () => {
    it("returns isMuted true when the current user is muted", () => {
      mockCircleData.data.members = [makeMember("user-me", true)] as any;
      const { result } = render();
      expect(result.current.isMuted).toBe(true);
    });

    it("returns isMuted false when the current user is not muted", () => {
      mockCircleData.data.members = [makeMember("user-me", false)] as any;
      const { result } = render();
      expect(result.current.isMuted).toBe(false);
    });

    it("returns isMuted false when the current user is not in the members list", () => {
      mockCircleData.data.members = [makeMember("user-other", false)] as any;
      const { result } = render();
      expect(result.current.isMuted).toBe(false);
    });

    it("returns isMuted false when members list is empty", () => {
      mockCircleData.data.members = [];
      const { result } = render();
      expect(result.current.isMuted).toBe(false);
    });

    it("does not call mutateAsync when the user is muted", async () => {
      mockCircleData.data.members = [makeMember("user-me", true)] as any;
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
      mockCircleData.loading.circles = true;
      mockCircleData.loading.members = true;
      mockCircleData.loading.messages = true;
      const { result } = render();

      expect(result.current.loading.circles).toBe(true);
      expect(result.current.loading.members).toBe(true);
      expect(result.current.loading.messages).toBe(true);
    });

    it("exposes members from useCircleData", () => {
      const members = [makeMember("user-1"), makeMember("user-2")];
      mockCircleData.data.members = members as any;
      const { result } = render();
      expect(result.current.data.members).toHaveLength(2);
    });
  });
});
