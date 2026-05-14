import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { InfiniteData } from "@tanstack/react-query";
import type {
  CircleMessage,
  CircleMessagesResponse,
  StudyCircle,
} from "@/zodSchemas/circle.zod";

// ── hoisted mocks ─────────────────────────────────────────────────────────────

const mockMutate = vi.hoisted(() => vi.fn());
const mockJoinCircle = vi.hoisted(() => vi.fn());
const mockLeaveCircle = vi.hoisted(() => vi.fn());

let capturedMessageHandler: ((msg: CircleMessage) => void) | null = null;

const mockOnMessage = vi.hoisted(() =>
  vi.fn((handler: (msg: CircleMessage) => void) => {
    capturedMessageHandler = handler;
    return () => {
      capturedMessageHandler = null;
    };
  }),
);

vi.mock("@/queries/circle", () => ({
  useUpdateCircleMemberLastReadAtMutation: vi.fn(() => ({
    mutate: mockMutate,
  })),
}));

vi.mock("@/features/study-circles/services/socketService", () => ({
  circleSocketService: {
    joinCircle: mockJoinCircle,
    leaveCircle: mockLeaveCircle,
    onMessage: mockOnMessage,
  },
}));

import { useCircleSync } from "@/features/study-circles/room/hooks/useCircleSync";

// ── fixtures ──────────────────────────────────────────────────────────────────

function makeMessage(overrides: Partial<CircleMessage> = {}): CircleMessage {
  return {
    id: 100,
    content: "Hello",
    circleId: "circle-1",
    createdAt: new Date().toISOString(),
    sender: { id: "user-1", username: "alice", avatar: null },
    ...overrides,
  } as CircleMessage;
}

function makeCircle(
  id: string,
  overrides: Partial<StudyCircle> = {},
): StudyCircle {
  return {
    id,
    name: `Circle ${id}`,
    unreadCount: 0,
    latestMessage: null,
    ...overrides,
  } as StudyCircle;
}

function makeInfiniteData(
  messages: CircleMessage[],
): InfiniteData<CircleMessagesResponse> {
  return {
    pages: [
      {
        data: messages,
        pagination: { nextCursor: null, hasMore: false },
      } as CircleMessagesResponse,
    ],
    pageParams: [null],
  };
}

// ── setup ─────────────────────────────────────────────────────────────────────

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderSync(circleId: string | null, queryClient: QueryClient) {
  return renderHook(() => useCircleSync(circleId), {
    wrapper: createWrapper(queryClient),
  });
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("useCircleSync", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedMessageHandler = null;
    queryClient = createQueryClient();

    // Re-wire onMessage to capture handler after clearAllMocks
    mockOnMessage.mockImplementation(
      (handler: (msg: CircleMessage) => void) => {
        capturedMessageHandler = handler;
        return () => {
          capturedMessageHandler = null;
        };
      },
    );
  });

  // ── on mount / cache interaction ───────────────────────────────────────────

  describe("on mount with a circleId", () => {
    it("zeros out unreadCount for the current circle in the sidebar cache", () => {
      queryClient.setQueryData<StudyCircle[]>(
        ["circles", "list"],
        [
          makeCircle("circle-1", { unreadCount: 5 }),
          makeCircle("circle-2", { unreadCount: 3 }),
        ],
      );

      renderSync("circle-1", queryClient);

      const list = queryClient.getQueryData<StudyCircle[]>(["circles", "list"]);
      const circle1 = list?.find((c) => c.id === "circle-1");
      const circle2 = list?.find((c) => c.id === "circle-2");

      expect(circle1?.unreadCount).toBe(0);
      expect(circle2?.unreadCount).toBe(3); // unchanged
    });

    it("does not modify other circles when zeroing unreadCount", () => {
      queryClient.setQueryData<StudyCircle[]>(
        ["circles", "list"],
        [
          makeCircle("circle-1", { unreadCount: 2 }),
          makeCircle("circle-2", { unreadCount: 7 }),
          makeCircle("circle-3", { unreadCount: 1 }),
        ],
      );

      renderSync("circle-1", queryClient);

      const list = queryClient.getQueryData<StudyCircle[]>(["circles", "list"]);
      expect(list?.find((c) => c.id === "circle-2")?.unreadCount).toBe(7);
      expect(list?.find((c) => c.id === "circle-3")?.unreadCount).toBe(1);
    });

    it("calls updateLastReadAtMutation.mutate with the circleId", () => {
      renderSync("circle-1", queryClient);
      expect(mockMutate).toHaveBeenCalledWith("circle-1");
    });

    it("calls joinCircle with the circleId", () => {
      renderSync("circle-1", queryClient);
      expect(mockJoinCircle).toHaveBeenCalledWith("circle-1");
    });

    it("does not call joinCircle or mutate when circleId is null", () => {
      renderSync(null, queryClient);
      expect(mockJoinCircle).not.toHaveBeenCalled();
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("registers an onMessage handler on mount", () => {
      renderSync("circle-1", queryClient);
      expect(mockOnMessage).toHaveBeenCalled();
      expect(capturedMessageHandler).not.toBeNull();
    });
  });

  // ── socket message: same room ──────────────────────────────────────────────

  describe("incoming message for the current room", () => {
    it("prepends the new message to the first page of the message cache", () => {
      const existingMsg = makeMessage({ id: 1, content: "Existing" });
      queryClient.setQueryData(
        ["circles", "circle-1", "messages"],
        makeInfiniteData([existingMsg]),
      );

      renderSync("circle-1", queryClient);

      const newMsg = makeMessage({ id: 2, content: "New message" });
      act(() => {
        capturedMessageHandler!(newMsg);
      });

      const cached = queryClient.getQueryData<
        InfiniteData<CircleMessagesResponse>
      >(["circles", "circle-1", "messages"]);
      expect(cached?.pages[0].data[0]).toEqual(newMsg);
      expect(cached?.pages[0].data[1]).toEqual(existingMsg);
    });

    it("does not add a message to a different circle's message cache", () => {
      const existingMsg = makeMessage({ id: 1, circleId: "circle-2" });
      queryClient.setQueryData(
        ["circles", "circle-2", "messages"],
        makeInfiniteData([existingMsg]),
      );

      renderSync("circle-1", queryClient);

      const newMsg = makeMessage({
        id: 2,
        circleId: "circle-2",
        content: "For circle 2",
      });
      act(() => {
        capturedMessageHandler!(newMsg);
      });

      const cached = queryClient.getQueryData<
        InfiniteData<CircleMessagesResponse>
      >(["circles", "circle-2", "messages"]);
      // Should be unchanged since current room is circle-1
      expect(cached?.pages[0].data).toHaveLength(1);
    });

    it("calls updateLastReadAtMutation.mutate again when a message arrives in the current room", () => {
      renderSync("circle-1", queryClient);
      mockMutate.mockClear(); // clear the mount call

      const newMsg = makeMessage({ id: 2 });
      act(() => {
        capturedMessageHandler!(newMsg);
      });

      expect(mockMutate).toHaveBeenCalledWith("circle-1");
    });

    it("does not change unreadCount for the current circle on incoming message", () => {
      queryClient.setQueryData<StudyCircle[]>(
        ["circles", "list"],
        [makeCircle("circle-1", { unreadCount: 0 })],
      );

      renderSync("circle-1", queryClient);

      const newMsg = makeMessage({ id: 2 });
      act(() => {
        capturedMessageHandler!(newMsg);
      });

      const list = queryClient.getQueryData<StudyCircle[]>(["circles", "list"]);
      expect(list?.find((c) => c.id === "circle-1")?.unreadCount).toBe(0);
    });

    it("updates latestMessage in the sidebar for the current circle", () => {
      queryClient.setQueryData<StudyCircle[]>(
        ["circles", "list"],
        [makeCircle("circle-1")],
      );

      renderSync("circle-1", queryClient);

      const newMsg = makeMessage({ id: 2, content: "Latest!" });
      act(() => {
        capturedMessageHandler!(newMsg);
      });

      const list = queryClient.getQueryData<StudyCircle[]>(["circles", "list"]);
      expect(list?.find((c) => c.id === "circle-1")?.latestMessage).toEqual(
        newMsg,
      );
    });
  });

  // ── duplicate prevention ───────────────────────────────────────────────────

  describe("duplicate prevention", () => {
    it("does not add a message with the same id that already exists", () => {
      const existingMsg = makeMessage({ id: 5, content: "Already here" });
      queryClient.setQueryData(
        ["circles", "circle-1", "messages"],
        makeInfiniteData([existingMsg]),
      );

      renderSync("circle-1", queryClient);

      const duplicateMsg = makeMessage({ id: 5, content: "Already here" });
      act(() => {
        capturedMessageHandler!(duplicateMsg);
      });

      const cached = queryClient.getQueryData<
        InfiniteData<CircleMessagesResponse>
      >(["circles", "circle-1", "messages"]);
      expect(cached?.pages[0].data).toHaveLength(1);
    });

    it("replaces an optimistic (id < 0) message with the confirmed server message", () => {
      const optimisticMsg = makeMessage({
        id: -1,
        content: "Optimistic",
        sender: { id: "user-me", username: "me", avatar: null },
      });
      queryClient.setQueryData(
        ["circles", "circle-1", "messages"],
        makeInfiniteData([optimisticMsg]),
      );

      renderSync("circle-1", queryClient);

      const confirmedMsg = makeMessage({
        id: 99,
        content: "Optimistic",
        sender: { id: "user-me", username: "me", avatar: null },
      });
      act(() => {
        capturedMessageHandler!(confirmedMsg);
      });

      const cached = queryClient.getQueryData<
        InfiniteData<CircleMessagesResponse>
      >(["circles", "circle-1", "messages"]);
      const data = cached?.pages[0].data;
      expect(data).toHaveLength(1);
      expect(data![0].id).toBe(99); // optimistic replaced
    });

    it("does not replace an optimistic message if content differs", () => {
      const optimisticMsg = makeMessage({
        id: -1,
        content: "Optimistic A",
        sender: { id: "user-me", username: "me", avatar: null },
      });
      queryClient.setQueryData(
        ["circles", "circle-1", "messages"],
        makeInfiniteData([optimisticMsg]),
      );

      renderSync("circle-1", queryClient);

      const serverMsg = makeMessage({
        id: 99,
        content: "Optimistic B", // different content
        sender: { id: "user-me", username: "me", avatar: null },
      });
      act(() => {
        capturedMessageHandler!(serverMsg);
      });

      const cached = queryClient.getQueryData<
        InfiniteData<CircleMessagesResponse>
      >(["circles", "circle-1", "messages"]);
      const data = cached?.pages[0].data;
      // Both exist — optimistic not replaced
      expect(data).toHaveLength(2);
    });

    it("does not replace an optimistic message if sender differs", () => {
      const optimisticMsg = makeMessage({
        id: -1,
        content: "Hello",
        sender: { id: "user-a", username: "alice", avatar: null },
      });
      queryClient.setQueryData(
        ["circles", "circle-1", "messages"],
        makeInfiniteData([optimisticMsg]),
      );

      renderSync("circle-1", queryClient);

      const serverMsg = makeMessage({
        id: 99,
        content: "Hello",
        sender: { id: "user-b", username: "bob", avatar: null }, // different sender
      });
      act(() => {
        capturedMessageHandler!(serverMsg);
      });

      const cached = queryClient.getQueryData<
        InfiniteData<CircleMessagesResponse>
      >(["circles", "circle-1", "messages"]);
      expect(cached?.pages[0].data).toHaveLength(2);
    });
  });

  // ── socket message: different room ────────────────────────────────────────

  describe("incoming message for a different room", () => {
    it("increments unreadCount in the sidebar for the other circle", () => {
      queryClient.setQueryData<StudyCircle[]>(
        ["circles", "list"],
        [
          makeCircle("circle-1", { unreadCount: 0 }),
          makeCircle("circle-2", { unreadCount: 2 }),
        ],
      );

      renderSync("circle-1", queryClient);

      const msgForCircle2 = makeMessage({ id: 10, circleId: "circle-2" });
      act(() => {
        capturedMessageHandler!(msgForCircle2);
      });

      const list = queryClient.getQueryData<StudyCircle[]>(["circles", "list"]);
      expect(list?.find((c) => c.id === "circle-2")?.unreadCount).toBe(3);
    });

    it("does not increment unreadCount for the currently viewed circle", () => {
      queryClient.setQueryData<StudyCircle[]>(
        ["circles", "list"],
        [
          makeCircle("circle-1", { unreadCount: 0 }),
          makeCircle("circle-2", { unreadCount: 0 }),
        ],
      );

      renderSync("circle-1", queryClient);

      const msgForCircle2 = makeMessage({ id: 10, circleId: "circle-2" });
      act(() => {
        capturedMessageHandler!(msgForCircle2);
      });

      const list = queryClient.getQueryData<StudyCircle[]>(["circles", "list"]);
      expect(list?.find((c) => c.id === "circle-1")?.unreadCount).toBe(0);
    });

    it("updates latestMessage in the sidebar for the other circle", () => {
      queryClient.setQueryData<StudyCircle[]>(
        ["circles", "list"],
        [makeCircle("circle-2")],
      );

      renderSync("circle-1", queryClient);

      const msgForCircle2 = makeMessage({
        id: 10,
        circleId: "circle-2",
        content: "Sidebar update",
      });
      act(() => {
        capturedMessageHandler!(msgForCircle2);
      });

      const list = queryClient.getQueryData<StudyCircle[]>(["circles", "list"]);
      expect(list?.find((c) => c.id === "circle-2")?.latestMessage).toEqual(
        msgForCircle2,
      );
    });

    it("does not call updateLastReadAtMutation for a different room message", () => {
      renderSync("circle-1", queryClient);
      mockMutate.mockClear();

      const msgForCircle2 = makeMessage({ id: 10, circleId: "circle-2" });
      act(() => {
        capturedMessageHandler!(msgForCircle2);
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  // ── cleanup ────────────────────────────────────────────────────────────────

  describe("cleanup on unmount", () => {
    it("calls leaveCircle with the circleId on unmount", () => {
      const { unmount } = renderSync("circle-1", queryClient);
      unmount();
      expect(mockLeaveCircle).toHaveBeenCalledWith("circle-1");
    });

    it("unsubscribes the message handler on unmount", () => {
      const { unmount } = renderSync("circle-1", queryClient);
      unmount();
      expect(capturedMessageHandler).toBeNull();
    });

    it("does not call leaveCircle when circleId is null", () => {
      const { unmount } = renderSync(null, queryClient);
      unmount();
      expect(mockLeaveCircle).not.toHaveBeenCalled();
    });

    it("calls leaveCircle with the old id when circleId changes", () => {
      // 1. Render the hook with the initial ID
      const { rerender } = renderHook(({ id }) => useCircleSync(id), {
        wrapper: createWrapper(queryClient),
        initialProps: { id: "circle-1" }, // Pass initial props here
      });

      // 2. Verify it joined the first circle
      expect(mockJoinCircle).toHaveBeenCalledWith("circle-1");

      // 3. Trigger a re-render with a NEW ID on the SAME hook instance
      rerender({ id: "circle-2" });

      // 4. NOW the cleanup for "circle-1" should have fired
      expect(mockLeaveCircle).toHaveBeenCalledWith("circle-1");

      // 5. And it should have joined "circle-2"
      expect(mockJoinCircle).toHaveBeenCalledWith("circle-2");
    });
  });
});
