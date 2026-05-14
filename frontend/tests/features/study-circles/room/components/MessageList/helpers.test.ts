import { describe, it, expect } from "vitest";
import {
  getDateLabel,
  shouldShowSender,
  groupMessagesByDate,
} from "@/features/study-circles/room/components/MessageList/helpers";
import type { CircleMessage } from "@/zodSchemas/circle.zod";

// ── fixtures ──────────────────────────────────────────────────────────────────

function makeMessage(
  overrides: Partial<CircleMessage> & { senderId?: string } = {},
): CircleMessage {
  const { senderId = "user-1", ...rest } = overrides;
  return {
    id: Math.floor(Math.random() * 10000),
    content: "Hello",
    circleId: "circle-1",
    createdAt: new Date().toISOString(),
    sender: {
      id: senderId,
      username: "alice",
      avatar: null,
    },
    ...rest,
  } as CircleMessage;
}

function atDate(date: Date, senderId = "user-1"): CircleMessage {
  return makeMessage({ senderId, createdAt: date.toISOString() });
}

// Fixed reference dates
const TODAY = new Date();
const YESTERDAY = new Date(TODAY);
YESTERDAY.setDate(TODAY.getDate() - 1);
const TWO_DAYS_AGO = new Date(TODAY);
TWO_DAYS_AGO.setDate(TODAY.getDate() - 2);
const SPECIFIC_DATE = new Date(2024, 2, 15); // March 15 2024

describe("helpers", () => {
  // ── getDateLabel ────────────────────────────────────────────────────────────

  describe("getDateLabel", () => {
    it("returns 'Today' for today's date", () => {
      expect(getDateLabel(new Date())).toBe("Today");
    });

    it("returns 'Yesterday' for yesterday's date", () => {
      expect(getDateLabel(YESTERDAY)).toBe("Yesterday");
    });

    it("returns formatted date string for older dates", () => {
      expect(getDateLabel(SPECIFIC_DATE)).toBe("March 15, 2024");
    });

    it("returns formatted date string for two days ago", () => {
      const result = getDateLabel(TWO_DAYS_AGO);
      expect(result).not.toBe("Today");
      expect(result).not.toBe("Yesterday");
      // Should be a formatted string like "Month D, YYYY"
      expect(result).toMatch(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
    });

    it("formats single-digit days without zero-padding", () => {
      const date = new Date(2024, 0, 5); // January 5 2024
      expect(getDateLabel(date)).toBe("January 5, 2024");
    });

    it("formats double-digit days correctly", () => {
      const date = new Date(2024, 11, 25); // December 25 2024
      expect(getDateLabel(date)).toBe("December 25, 2024");
    });

    it("uses today's exact timestamp and still returns 'Today'", () => {
      const now = new Date();
      expect(getDateLabel(now)).toBe("Today");
    });
  });

  // ── shouldShowSender ────────────────────────────────────────────────────────

  describe("shouldShowSender", () => {
    it("returns true when there is no previous message", () => {
      const msg = makeMessage();
      expect(shouldShowSender(msg, undefined)).toBe(true);
    });

    it("returns true when sender differs from previous message", () => {
      const prev = makeMessage({ senderId: "user-1" });
      const curr = makeMessage({ senderId: "user-2" });
      expect(shouldShowSender(curr, prev)).toBe(false === false && true);
      // explicit:
      expect(shouldShowSender(curr, prev)).toBe(true);
    });

    it("returns false when same sender on same day", () => {
      const date = new Date(2024, 5, 10, 12, 0, 0);
      const later = new Date(2024, 5, 10, 12, 30, 0);
      const prev = atDate(date, "user-1");
      const curr = atDate(later, "user-1");
      expect(shouldShowSender(curr, prev)).toBe(false);
    });

    it("returns true when same sender but messages are on different days", () => {
      const prev = atDate(new Date(2024, 5, 10), "user-1");
      const curr = atDate(new Date(2024, 5, 11), "user-1");
      expect(shouldShowSender(curr, prev)).toBe(true);
    });

    it("returns true when different sender on same day", () => {
      const date = new Date(2024, 5, 10, 9, 0, 0);
      const later = new Date(2024, 5, 10, 9, 5, 0);
      const prev = atDate(date, "user-1");
      const curr = atDate(later, "user-2");
      expect(shouldShowSender(curr, prev)).toBe(true);
    });

    it("returns true when different sender on different day", () => {
      const prev = atDate(new Date(2024, 5, 10), "user-1");
      const curr = atDate(new Date(2024, 5, 11), "user-2");
      expect(shouldShowSender(curr, prev)).toBe(true);
    });

    it("treats messages at midnight boundary as different days", () => {
      const endOfDay = new Date(2024, 5, 10, 23, 59, 59);
      const startOfNextDay = new Date(2024, 5, 11, 0, 0, 0);
      const prev = atDate(endOfDay, "user-1");
      const curr = atDate(startOfNextDay, "user-1");
      expect(shouldShowSender(curr, prev)).toBe(true);
    });
  });

  // ── groupMessagesByDate ─────────────────────────────────────────────────────

  describe("groupMessagesByDate", () => {
    it("returns an empty array for empty input", () => {
      expect(groupMessagesByDate([])).toEqual([]);
    });

    it("returns a single group for a single message", () => {
      const msg = atDate(new Date(2024, 5, 10));
      const result = groupMessagesByDate([msg]);

      expect(result).toHaveLength(1);
      expect(result[0].messages).toHaveLength(1);
    });

    it("sets showSender to true for the first message in a group", () => {
      const msg = atDate(new Date(2024, 5, 10));
      const result = groupMessagesByDate([msg]);

      expect(result[0].messages[0].showSender).toBe(true);
    });

    it("groups messages on the same day into one group", () => {
      const messages = [
        atDate(new Date(2024, 5, 10, 9, 0), "user-1"),
        atDate(new Date(2024, 5, 10, 10, 0), "user-1"),
        atDate(new Date(2024, 5, 10, 11, 0), "user-1"),
      ];

      const result = groupMessagesByDate(messages);

      expect(result).toHaveLength(1);
      expect(result[0].messages).toHaveLength(3);
    });

    it("creates separate groups for messages on different days", () => {
      const messages = [
        atDate(new Date(2024, 5, 10)),
        atDate(new Date(2024, 5, 11)),
        atDate(new Date(2024, 5, 12)),
      ];

      const result = groupMessagesByDate(messages);

      expect(result).toHaveLength(3);
    });

    it("assigns the correct date to each group", () => {
      const date1 = new Date(2024, 5, 10, 8, 0);
      const date2 = new Date(2024, 5, 11, 8, 0);
      const messages = [atDate(date1), atDate(date2)];

      const result = groupMessagesByDate(messages);

      expect(result[0].date.toDateString()).toBe(date1.toDateString());
      expect(result[1].date.toDateString()).toBe(date2.toDateString());
    });

    it("sets showSender to false for consecutive messages from same sender on same day", () => {
      const messages = [
        atDate(new Date(2024, 5, 10, 9, 0), "user-1"),
        atDate(new Date(2024, 5, 10, 9, 5), "user-1"),
      ];

      const result = groupMessagesByDate(messages);
      const groupMessages = result[0].messages;

      expect(groupMessages[0].showSender).toBe(true);
      expect(groupMessages[1].showSender).toBe(false);
    });

    it("sets showSender to true when sender changes within same day group", () => {
      const messages = [
        atDate(new Date(2024, 5, 10, 9, 0), "user-1"),
        atDate(new Date(2024, 5, 10, 9, 5), "user-2"),
      ];

      const result = groupMessagesByDate(messages);
      const groupMessages = result[0].messages;

      expect(groupMessages[0].showSender).toBe(true);
      expect(groupMessages[1].showSender).toBe(true);
    });

    it("sets showSender to true for first message in a new day group even if same sender", () => {
      const messages = [
        atDate(new Date(2024, 5, 10, 23, 0), "user-1"),
        atDate(new Date(2024, 5, 11, 8, 0), "user-1"),
      ];

      const result = groupMessagesByDate(messages);

      expect(result).toHaveLength(2);
      expect(result[1].messages[0].showSender).toBe(true);
    });

    it("places message in existing group when a later message shares a date with an earlier group", () => {
      // Two messages on day 1, one on day 2, one back on day 1 (out of order)
      const day1a = atDate(new Date(2024, 5, 10, 8, 0), "user-1");
      const day2 = atDate(new Date(2024, 5, 11, 8, 0), "user-1");
      const day1b = atDate(new Date(2024, 5, 10, 9, 0), "user-2");

      const result = groupMessagesByDate([day1a, day2, day1b]);

      // day1 group should contain both day1 messages
      const day1Group = result.find(
        (g) => g.date.toDateString() === new Date(2024, 5, 10).toDateString(),
      );
      expect(day1Group?.messages).toHaveLength(2);
    });

    it("preserves original message reference inside grouped output", () => {
      const msg = atDate(new Date(2024, 5, 10));
      const result = groupMessagesByDate([msg]);

      expect(result[0].messages[0].message).toBe(msg);
    });

    it("handles a mix of same-sender and different-sender messages across days", () => {
      const messages = [
        atDate(new Date(2024, 5, 10, 9, 0), "user-1"),
        atDate(new Date(2024, 5, 10, 9, 1), "user-1"),
        atDate(new Date(2024, 5, 10, 9, 2), "user-2"),
        atDate(new Date(2024, 5, 11, 9, 0), "user-1"),
        atDate(new Date(2024, 5, 11, 9, 1), "user-1"),
      ];

      const result = groupMessagesByDate(messages);

      expect(result).toHaveLength(2);

      const day1 = result[0].messages;
      expect(day1[0].showSender).toBe(true); // first ever
      expect(day1[1].showSender).toBe(false); // same sender
      expect(day1[2].showSender).toBe(true); // sender changed

      const day2 = result[1].messages;
      expect(day2[0].showSender).toBe(true); // new day
      expect(day2[1].showSender).toBe(false); // same sender continues
    });

    it("returns groups whose messages array contains all fields from the original message", () => {
      const msg = makeMessage({
        id: 42,
        content: "Test content",
        circleId: "circle-abc",
        createdAt: new Date(2024, 5, 10).toISOString(),
        senderId: "user-99",
      });

      const result = groupMessagesByDate([msg]);
      const grouped = result[0].messages[0].message;

      expect(grouped.id).toBe(42);
      expect(grouped.content).toBe("Test content");
      expect(grouped.circleId).toBe("circle-abc");
      expect(grouped.sender.id).toBe("user-99");
    });
  });
});
