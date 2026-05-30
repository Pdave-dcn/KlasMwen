import { it, expect, describe, vi, beforeEach } from "vitest";

import { NotificationNotFoundError } from "../../src/core/error/custom/notification.error.js";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../src/controllers/notification.controller.js";

const mockGetUserNotifications = vi.fn();
const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();

vi.mock("../../src/features/notification/service/index.js", () => ({
  notificationService: {
    query: {
      getUserNotifications: (...args: unknown[]) => mockGetUserNotifications(...args),
    },
    command: {
      markAsRead: (...args: unknown[]) => mockMarkAsRead(...args),
      markAllAsRead: (...args: unknown[]) => mockMarkAllAsRead(...args),
    },
  },
}));

vi.mock("../../src/core/config/logger.js", () => ({
  createLogger: vi.fn(() => ({
    child: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

type MockReq = Record<string, unknown>;
type MockRes = { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
type MockNext = ReturnType<typeof vi.fn>;

function createReq(overrides: Record<string, unknown> = {}): MockReq {
  return {
    params: {},
    body: {},
    query: {},
    ...overrides,
  };
}

function createRes(): MockRes {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

const mockUserId = "c3d4e5f6-7890-4b78-8a90-90abcdef1234";

describe("Notification Controller", () => {
  let mockRequest: MockReq;
  let mockResponse: MockRes;
  let mockNext: MockNext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = createRes();
    mockNext = vi.fn();
  });

  describe("getNotifications", () => {
    it("should get notifications with default pagination", async () => {
      mockRequest = createReq({
        query: {},
        user: { id: mockUserId, role: "STUDENT" },
      });
      const mockResult = {
        data: [{ id: 1, type: "LIKE", read: false }],
        pagination: { nextCursor: null, hasMore: false },
        unreadCount: 1,
      };
      mockGetUserNotifications.mockResolvedValue(mockResult);

      await getNotifications(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetUserNotifications).toHaveBeenCalledWith(mockUserId, 10, undefined, {});
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it("should get notifications with custom limit", async () => {
      mockRequest = createReq({
        query: { limit: "5" },
        user: { id: mockUserId, role: "STUDENT" },
      });
      mockGetUserNotifications.mockResolvedValue({
        data: [],
        pagination: { nextCursor: null, hasMore: false },
        unreadCount: 0,
      });

      await getNotifications(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetUserNotifications).toHaveBeenCalledWith(mockUserId, 5, undefined, {});
    });

    it("should get notifications with cursor", async () => {
      mockRequest = createReq({
        query: { cursor: "5" },
        user: { id: mockUserId, role: "STUDENT" },
      });
      mockGetUserNotifications.mockResolvedValue({
        data: [],
        pagination: { nextCursor: 10, hasMore: true },
        unreadCount: 5,
      });

      await getNotifications(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetUserNotifications).toHaveBeenCalledWith(mockUserId, 10, 5, {});
    });

    it("should call next with validation error for invalid limit", async () => {
      mockRequest = createReq({
        query: { limit: "invalid" },
        user: { id: mockUserId, role: "STUDENT" },
      });

      await getNotifications(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetUserNotifications).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle service errors", async () => {
      const dbError = new Error("Database error");
      mockRequest = createReq({
        query: {},
        user: { id: mockUserId, role: "STUDENT" },
      });
      mockGetUserNotifications.mockRejectedValue(dbError);

      await getNotifications(mockRequest as any, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe("markNotificationAsRead", () => {
    it("should mark notification as read successfully", async () => {
      mockRequest = createReq({
        params: { id: "123" },
        user: { id: mockUserId, role: "STUDENT" },
      });
      mockMarkAsRead.mockResolvedValue(undefined);

      await markNotificationAsRead(mockRequest as any, mockResponse as any, mockNext);

      expect(mockMarkAsRead).toHaveBeenCalledWith(123, { id: mockUserId, role: "STUDENT" });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Notification marked as read",
      });
    });

    it("should call next with validation error for invalid id", async () => {
      mockRequest = createReq({
        params: { id: "invalid" },
        user: { id: mockUserId, role: "STUDENT" },
      });

      await markNotificationAsRead(mockRequest as any, mockResponse as any, mockNext);

      expect(mockMarkAsRead).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should call next with NotificationNotFoundError when notification does not exist", async () => {
      mockRequest = createReq({
        params: { id: "999" },
        user: { id: mockUserId, role: "STUDENT" },
      });
      mockMarkAsRead.mockRejectedValue(new NotificationNotFoundError(999));

      await markNotificationAsRead(mockRequest as any, mockResponse as any, mockNext);

      expect(mockMarkAsRead).toHaveBeenCalledWith(999, { id: mockUserId, role: "STUDENT" });
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotificationNotFoundError));
    });

    it("should handle service errors", async () => {
      const dbError = new Error("Database error");
      mockRequest = createReq({
        params: { id: "123" },
        user: { id: mockUserId, role: "STUDENT" },
      });
      mockMarkAsRead.mockRejectedValue(dbError);

      await markNotificationAsRead(mockRequest as any, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe("markAllNotificationsAsRead", () => {
    it("should mark all notifications as read successfully", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
      });
      mockMarkAllAsRead.mockResolvedValue({ count: 5 });

      await markAllNotificationsAsRead(mockRequest as any, mockResponse as any, mockNext);

      expect(mockMarkAllAsRead).toHaveBeenCalledWith(mockUserId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "All notifications marked as read",
      });
    });

    it("should handle service errors", async () => {
      const dbError = new Error("Database error");
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
      });
      mockMarkAllAsRead.mockRejectedValue(dbError);

      await markAllNotificationsAsRead(mockRequest as any, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });
});
