import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── hoisted mocks ─────────────────────────────────────────────────────────────

const mockUnsubJoined = vi.hoisted(() => vi.fn());
const mockUnsubLeft = vi.hoisted(() => vi.fn());

let capturedJoinedHandler: ((payload: unknown) => void) | null = null;
let capturedLeftHandler: ((payload: unknown) => void) | null = null;

const mockOnMemberJoined = vi.hoisted(() =>
  vi.fn((handler: (payload: unknown) => void) => {
    capturedJoinedHandler = handler;
    return mockUnsubJoined;
  }),
);

const mockOnMemberLeft = vi.hoisted(() =>
  vi.fn((handler: (payload: unknown) => void) => {
    capturedLeftHandler = handler;
    return mockUnsubLeft;
  }),
);

const mockStoreState = vi.hoisted(() => ({
  setMemberJoined: vi.fn(),
  setMemberLeft: vi.fn(),
  clearPresence: vi.fn(),
  clearOnlineMembers: vi.fn(),
}));

vi.mock("@/features/study-circles/services/socketService", () => ({
  circleSocketService: {
    onMemberJoined: mockOnMemberJoined,
    onMemberLeft: mockOnMemberLeft,
  },
}));

vi.mock("@/stores/circle.store", () => ({
  useCircleStore: {
    getState: vi.fn(() => mockStoreState),
  },
}));

import { useCirclePresence } from "@/features/study-circles/room/hooks/useCirclePresence";

// ── helpers ───────────────────────────────────────────────────────────────────

function render(groupId: string | null) {
  return renderHook(() => useCirclePresence(groupId));
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("useCirclePresence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedJoinedHandler = null;
    capturedLeftHandler = null;

    // Re-wire handlers after clearAllMocks
    mockOnMemberJoined.mockImplementation(
      (handler: (payload: unknown) => void) => {
        capturedJoinedHandler = handler;
        return mockUnsubJoined;
      },
    );

    mockOnMemberLeft.mockImplementation(
      (handler: (payload: unknown) => void) => {
        capturedLeftHandler = handler;
        return mockUnsubLeft;
      },
    );
  });

  // ── subscription management ───────────────────────────────────────────────

  describe("subscription management", () => {
    it("registers onMemberJoined listener when groupId is provided", () => {
      render("circle-1");
      expect(mockOnMemberJoined).toHaveBeenCalledTimes(1);
    });

    it("registers onMemberLeft listener when groupId is provided", () => {
      render("circle-1");
      expect(mockOnMemberLeft).toHaveBeenCalledTimes(1);
    });

    it("captures a handler function for onMemberJoined", () => {
      render("circle-1");
      expect(capturedJoinedHandler).toBeTypeOf("function");
    });

    it("captures a handler function for onMemberLeft", () => {
      render("circle-1");
      expect(capturedLeftHandler).toBeTypeOf("function");
    });

    it("calls unsubJoined on unmount", () => {
      const { unmount } = render("circle-1");
      unmount();
      expect(mockUnsubJoined).toHaveBeenCalledTimes(1);
    });

    it("calls unsubLeft on unmount", () => {
      const { unmount } = render("circle-1");
      unmount();
      expect(mockUnsubLeft).toHaveBeenCalledTimes(1);
    });

    it("calls clearPresence on unmount", () => {
      const { unmount } = render("circle-1");
      unmount();
      expect(mockStoreState.clearPresence).toHaveBeenCalledTimes(1);
    });

    it("calls clearOnlineMembers on unmount", () => {
      const { unmount } = render("circle-1");
      unmount();
      expect(mockStoreState.clearOnlineMembers).toHaveBeenCalledTimes(1);
    });

    it("calls all four cleanup functions on unmount", () => {
      const { unmount } = render("circle-1");
      unmount();
      expect(mockUnsubJoined).toHaveBeenCalled();
      expect(mockUnsubLeft).toHaveBeenCalled();
      expect(mockStoreState.clearPresence).toHaveBeenCalled();
      expect(mockStoreState.clearOnlineMembers).toHaveBeenCalled();
    });

    it("re-registers listeners when groupId changes", () => {
      const { rerender } = renderHook(
        ({ id }: { id: string | null }) => useCirclePresence(id),
        { initialProps: { id: "circle-1" } },
      );

      rerender({ id: "circle-2" });

      // First cleanup, then new subscription
      expect(mockUnsubJoined).toHaveBeenCalledTimes(1);
      expect(mockOnMemberJoined).toHaveBeenCalledTimes(2);
    });
  });

  // ── null groupId guard ────────────────────────────────────────────────────

  describe("null groupId guard", () => {
    it("does not register onMemberJoined when groupId is null", () => {
      render(null);
      expect(mockOnMemberJoined).not.toHaveBeenCalled();
    });

    it("does not register onMemberLeft when groupId is null", () => {
      render(null);
      expect(mockOnMemberLeft).not.toHaveBeenCalled();
    });

    it("does not call any store methods when groupId is null", () => {
      render(null);
      expect(mockStoreState.setMemberJoined).not.toHaveBeenCalled();
      expect(mockStoreState.setMemberLeft).not.toHaveBeenCalled();
      expect(mockStoreState.clearPresence).not.toHaveBeenCalled();
      expect(mockStoreState.clearOnlineMembers).not.toHaveBeenCalled();
    });

    it("does not call cleanup functions on unmount when groupId was null", () => {
      const { unmount } = render(null);
      unmount();
      expect(mockUnsubJoined).not.toHaveBeenCalled();
      expect(mockUnsubLeft).not.toHaveBeenCalled();
      expect(mockStoreState.clearPresence).not.toHaveBeenCalled();
      expect(mockStoreState.clearOnlineMembers).not.toHaveBeenCalled();
    });
  });

  // ── valid data flow: member joined ────────────────────────────────────────

  describe("valid memberJoined payload", () => {
    it("calls setMemberJoined with the user id", () => {
      render("circle-1");
      capturedJoinedHandler!({
        user: {
          id: "3bc1b50c-61bb-469b-a665-526ccce868fa",
          username: "User123",
        },
      });
      expect(mockStoreState.setMemberJoined).toHaveBeenCalledWith(
        "3bc1b50c-61bb-469b-a665-526ccce868fa",
      );
    });

    it("calls setMemberJoined exactly once per event", () => {
      render("circle-1");
      capturedJoinedHandler!({
        user: {
          id: "3bc1b50c-61bb-469b-a665-526ccce868fa",
          username: "User456",
        },
      });
      expect(mockStoreState.setMemberJoined).toHaveBeenCalledTimes(1);
    });

    it("calls setMemberJoined with the correct id for multiple sequential events", () => {
      render("circle-1");
      capturedJoinedHandler!({
        user: {
          id: "3bc1b50c-61bb-469b-a665-526ccce868fa",
          username: "User789",
        },
      });
      capturedJoinedHandler!({
        user: {
          id: "3bc1b50c-61bb-469b-a665-526ccce868fa",
          username: "User101",
        },
      });
      expect(mockStoreState.setMemberJoined).toHaveBeenNthCalledWith(
        1,
        "3bc1b50c-61bb-469b-a665-526ccce868fa",
      );
      expect(mockStoreState.setMemberJoined).toHaveBeenNthCalledWith(
        2,
        "3bc1b50c-61bb-469b-a665-526ccce868fa",
      );
    });

    it("does not call setMemberLeft when a joined event fires", () => {
      render("circle-1");
      capturedJoinedHandler!({
        user: {
          id: "3bc1b50c-61bb-469b-a665-526ccce868fa",
          username: "User123",
        },
      });
      expect(mockStoreState.setMemberLeft).not.toHaveBeenCalled();
    });
  });

  // ── valid data flow: member left ──────────────────────────────────────────

  describe("valid memberLeft payload", () => {
    it("calls setMemberLeft with the user id", () => {
      render("circle-1");
      capturedLeftHandler!({
        user: {
          id: "3bc1b50c-61bb-469b-a665-526ccce868fa",
          username: "User123",
        },
      });
      expect(mockStoreState.setMemberLeft).toHaveBeenCalledWith(
        "3bc1b50c-61bb-469b-a665-526ccce868fa",
      );
    });

    it("calls setMemberLeft exactly once per event", () => {
      render("circle-1");
      capturedLeftHandler!({
        user: {
          id: "3bc1b50c-61bb-469b-a665-526ccce868fa",
          username: "User456",
        },
      });
      expect(mockStoreState.setMemberLeft).toHaveBeenCalledTimes(1);
    });

    it("does not call setMemberJoined when a left event fires", () => {
      render("circle-1");
      capturedLeftHandler!({
        user: {
          id: "3bc1b50c-61bb-469b-a665-526ccce868fa",
          username: "User456",
        },
      });
      expect(mockStoreState.setMemberJoined).not.toHaveBeenCalled();
    });
  });

  // ── invalid data: Zod guard (memberJoined) ────────────────────────────────

  describe("invalid memberJoined payload (Zod guard)", () => {
    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("calls console.error when id is a number instead of a string", () => {
      render("circle-1");
      capturedJoinedHandler!({ user: { id: 123 } });
      expect(console.error).toHaveBeenCalled();
    });

    it("does not call setMemberJoined when id is a number", () => {
      render("circle-1");
      capturedJoinedHandler!({ user: { id: 123 } });
      expect(mockStoreState.setMemberJoined).not.toHaveBeenCalled();
    });

    it("calls console.error for an empty object payload", () => {
      render("circle-1");
      capturedJoinedHandler!({});
      expect(console.error).toHaveBeenCalled();
    });

    it("does not call setMemberJoined for an empty object payload", () => {
      render("circle-1");
      capturedJoinedHandler!({});
      expect(mockStoreState.setMemberJoined).not.toHaveBeenCalled();
    });

    it("calls console.error when user field is missing", () => {
      render("circle-1");
      capturedJoinedHandler!({ userId: "user-1" });
      expect(console.error).toHaveBeenCalled();
    });

    it("calls console.error when payload is null", () => {
      render("circle-1");
      capturedJoinedHandler!(null);
      expect(console.error).toHaveBeenCalled();
    });

    it("calls console.error when user id is missing", () => {
      render("circle-1");
      capturedJoinedHandler!({ user: {} });
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ── invalid data: Zod guard (memberLeft) ─────────────────────────────────

  describe("invalid memberLeft payload (Zod guard)", () => {
    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("calls console.error when id is a number instead of a string", () => {
      render("circle-1");
      capturedLeftHandler!({ user: { id: 123 } });
      expect(console.error).toHaveBeenCalled();
    });

    it("does not call setMemberLeft when id is a number", () => {
      render("circle-1");
      capturedLeftHandler!({ user: { id: 123 } });
      expect(mockStoreState.setMemberLeft).not.toHaveBeenCalled();
    });

    it("calls console.error for an empty object payload", () => {
      render("circle-1");
      capturedLeftHandler!({});
      expect(console.error).toHaveBeenCalled();
    });

    it("does not call setMemberLeft for an empty object payload", () => {
      render("circle-1");
      capturedLeftHandler!({});
      expect(mockStoreState.setMemberLeft).not.toHaveBeenCalled();
    });

    it("calls console.error when payload is null", () => {
      render("circle-1");
      capturedLeftHandler!(null);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
