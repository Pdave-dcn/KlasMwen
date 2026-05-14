import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { subDays } from "date-fns";
import type { CircleMessage } from "@/zodSchemas/circle.zod";

// ── mocks ─────────────────────────────────────────────────────────────────────

// IntersectionObserver is not available in jsdom
const mockIntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.stubGlobal("IntersectionObserver", mockIntersectionObserver);

// scrollIntoView is not implemented in jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

vi.mock("../UserAvatar", () => ({
  UserAvatar: ({ user }: { user: { username: string } }) => (
    <div data-testid="user-avatar">{user.username}</div>
  ),
}));

import { MessageList } from "@/features/study-circles/room/components/MessageList/MessageList";
import { MessageBubble } from "@/features/study-circles/room/components/MessageList/MessageBubble";

// ── fixtures ──────────────────────────────────────────────────────────────────

let idCounter = 1;

function makeMessage(
  overrides: Partial<CircleMessage> & {
    senderId?: string;
    username?: string;
  } = {},
): CircleMessage {
  const {
    senderId = "user-other",
    username = "bob",
    ...rest
  } = overrides as any;
  return {
    id: idCounter++,
    content: "Hello",
    circleId: "circle-1",
    createdAt: new Date().toISOString(),
    sender: { id: senderId, username, avatar: null },
    ...rest,
  } as CircleMessage;
}

const CURRENT_USER_ID = "user-me";

function sentMessage(overrides: Partial<CircleMessage> = {}): CircleMessage {
  return makeMessage({
    senderId: CURRENT_USER_ID,
    username: "me",
    ...overrides,
  });
}

function receivedMessage(
  overrides: Partial<
    CircleMessage & { senderId?: string; username?: string }
  > = {},
): CircleMessage {
  return makeMessage({ senderId: "user-other", username: "bob", ...overrides });
}

// Default pagination — no more pages, nothing fetching
const defaultPagination = {
  fetchNextPage: vi.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
};

// ── helpers ───────────────────────────────────────────────────────────────────

function renderList(
  messages: CircleMessage[],
  isLoading = false,
  currentUserId = CURRENT_USER_ID,
) {
  return render(
    <MessageList
      messages={messages}
      currentUserId={currentUserId}
      isLoading={isLoading}
      pagination={defaultPagination}
    />,
  );
}

function renderBubble(
  message: CircleMessage,
  showSender = true,
  currentUserId = CURRENT_USER_ID,
) {
  return render(
    <MessageBubble
      message={message}
      currentUserId={currentUserId}
      showSender={showSender}
    />,
  );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("MessageList & MessageBubble", () => {
  beforeEach(() => {
    idCounter = 1;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── loading & empty states ─────────────────────────────────────────────────

  describe("empty / loading states", () => {
    it("renders LoadingState when isLoading is true", () => {
      renderList([], true);
      expect(screen.queryByTestId("message-bubble")).toBeNull();
    });

    it("does not render message bubbles when loading", () => {
      renderList([sentMessage()], true);
      expect(screen.queryByTestId("message-bubble")).toBeNull();
    });

    it("renders EmptyState when messages array is empty and not loading", () => {
      renderList([], false);
      expect(screen.queryByTestId("message-bubble")).toBeNull();
    });

    it("renders message bubbles when messages exist and not loading", () => {
      renderList([sentMessage()], false);
      expect(screen.getAllByTestId("message-bubble")).toHaveLength(1);
    });
  });

  // ── sent message layout ────────────────────────────────────────────────────

  describe("sent message (MessageBubble)", () => {
    it("applies flex-row-reverse to the outer wrapper for sent messages", () => {
      const { container } = renderBubble(sentMessage());
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("flex-row-reverse");
    });

    it("does not apply flex-row-reverse for received messages", () => {
      const { container } = renderBubble(receivedMessage());
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).not.toContain("flex-row-reverse");
    });

    it("applies flex-row to the outer wrapper for received messages", () => {
      const { container } = renderBubble(receivedMessage());
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("flex-row");
    });

    it("does not render avatar for sent messages", () => {
      renderBubble(sentMessage());
      expect(screen.queryByTestId("user-avatar")).toBeNull();
    });

    it("renders bg-primary class on the bubble for sent messages", () => {
      renderBubble(sentMessage());
      const bubble = screen.getByTestId("message-bubble");
      expect(bubble.className).toContain("bg-primary");
    });

    it("renders bg-muted class on the bubble for received messages", () => {
      renderBubble(receivedMessage());
      const bubble = screen.getByTestId("message-bubble");
      expect(bubble.className).toContain("bg-muted");
    });

    it("does not render sender-name for sent messages", () => {
      renderBubble(sentMessage(), true);
      expect(screen.queryByTestId("sender-name")).toBeNull();
    });

    it("renders the message content in the bubble", () => {
      const msg = sentMessage({ content: "Hey there!" });
      renderBubble(msg);
      expect(screen.getByText("Hey there!")).toBeDefined();
    });

    it("renders a formatted HH:mm timestamp", () => {
      const now = new Date(2024, 5, 10, 14, 35, 0);
      const msg = sentMessage({ createdAt: now.toISOString() });
      renderBubble(msg);
      expect(screen.getByTestId("timestamp").textContent).toBe("14:35");
    });
  });

  // ── received message layout ────────────────────────────────────────────────

  describe("received message (MessageBubble)", () => {
    it("renders avatar when showSender is true", () => {
      renderBubble(receivedMessage(), true);
      expect(screen.getByTestId("user-avatar")).toBeDefined();
    });

    it("does not render avatar when showSender is false", () => {
      renderBubble(receivedMessage(), false);
      expect(screen.queryByTestId("user-avatar")).toBeNull();
    });

    it("renders sender-name when showSender is true", () => {
      const msg = receivedMessage();
      renderBubble(msg, true);
      expect(screen.getByTestId("sender-name").textContent).toBe(
        msg.sender.username,
      );
    });

    it("does not render sender-name when showSender is false", () => {
      renderBubble(receivedMessage(), false);
      expect(screen.queryByTestId("sender-name")).toBeNull();
    });

    it("renders a spacer div instead of avatar when showSender is false", () => {
      const { container } = renderBubble(receivedMessage(), false);
      const spacer = container.querySelector(".w-8");
      expect(spacer).not.toBeNull();
    });
  });

  // ── date dividers ──────────────────────────────────────────────────────────

  describe("date dividers in MessageList", () => {
    it("renders a date divider for each distinct day", () => {
      const today = new Date();
      const yesterday = subDays(today, 1);
      const messages = [
        receivedMessage({ createdAt: yesterday.toISOString() }),
        sentMessage({ createdAt: today.toISOString() }),
      ];
      renderList(messages);
      expect(screen.getByText("Yesterday")).toBeDefined();
      expect(screen.getByText("Today")).toBeDefined();
    });

    it("renders a single date divider when all messages are from the same day", () => {
      const now = new Date();
      const messages = [
        sentMessage({ createdAt: now.toISOString() }),
        receivedMessage({ createdAt: now.toISOString() }),
      ];
      renderList(messages);
      const todayLabels = screen.getAllByText("Today");
      expect(todayLabels).toHaveLength(1);
    });
  });

  // ── auto-scroll ────────────────────────────────────────────────────────────
  // useLayoutEffect with behavior: "instant" — scroll happens synchronously
  // before paint, no timer involved.

  describe("auto-scroll behavior", () => {
    it("calls scrollIntoView synchronously on mount when messages are present", () => {
      const scrollIntoViewMock = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      renderList([sentMessage()]);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "instant" });
    });

    it("does not call scrollIntoView when messages array is empty", () => {
      const scrollIntoViewMock = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      renderList([]);

      expect(scrollIntoViewMock).not.toHaveBeenCalled();
    });

    it("does not call scrollIntoView again when a new message is appended", () => {
      const scrollIntoViewMock = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      const initialMessages = [sentMessage()];
      const { rerender } = renderList(initialMessages);

      expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);

      // Adding a message does not re-trigger since dependency is messages.length === 0
      const updatedMessages = [...initialMessages, receivedMessage()];
      rerender(
        <MessageList
          messages={updatedMessages}
          currentUserId={CURRENT_USER_ID}
          isLoading={false}
          pagination={defaultPagination}
        />,
      );

      expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    });
  });

  // ── integration: mixed sent and received ───────────────────────────────────

  describe("integration: mixed message list", () => {
    it("renders correct number of bubbles", () => {
      const messages = [sentMessage(), receivedMessage(), sentMessage()];
      renderList(messages);
      expect(screen.getAllByTestId("message-bubble")).toHaveLength(3);
    });

    it("shows sender name only for the first message in a consecutive received sequence", () => {
      const now = new Date();
      const slightly_later = new Date(now.getTime() + 60_000);
      const messages = [
        receivedMessage({ createdAt: now.toISOString() }),
        receivedMessage({ createdAt: slightly_later.toISOString() }),
      ];
      renderList(messages);
      expect(screen.getAllByTestId("sender-name")).toHaveLength(1);
    });

    it("shows sender name again after a different sender interrupts", () => {
      const t0 = new Date();
      const t1 = new Date(t0.getTime() + 60_000);
      const t2 = new Date(t0.getTime() + 120_000);
      const messages = [
        receivedMessage({
          senderId: "user-a",
          username: "alice",
          createdAt: t0.toISOString(),
        }),
        sentMessage({ createdAt: t1.toISOString() }),
        receivedMessage({
          senderId: "user-a",
          username: "alice",
          createdAt: t2.toISOString(),
        }),
      ];
      renderList(messages);
      expect(screen.getAllByTestId("sender-name")).toHaveLength(2);
    });

    it("renders message content for each message", () => {
      const messages = [
        sentMessage({ content: "Sent message" }),
        receivedMessage({ content: "Received message" }),
      ];
      renderList(messages);
      expect(screen.getByText("Sent message")).toBeDefined();
      expect(screen.getByText("Received message")).toBeDefined();
    });
  });
});
