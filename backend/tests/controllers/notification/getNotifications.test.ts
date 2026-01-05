import { Request, Response } from "express";
import { createMockRequest, createMockResponse } from "./shared/mocks.js";
import prisma from "../../../src/core/config/db.js";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getNotifications } from "../../../src/controllers/notification.controller.js";
import { NotificationWithRelations } from "../../../src/features/notification/service/types/NotificationTypes.js";

vi.mock("../../../src/core/config/logger.js", () => ({
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
  logger: {
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
  },
}));

vi.mock("../../../src/core/config/db.js", () => ({
  default: {
    notification: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("getNotifications controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;
  let mockNext: any;

  const mockUserId = "user-123";
  const mockNotifications: NotificationWithRelations[] = [
    {
      id: 1,
      type: "COMMENT_ON_POST",
      read: false,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      userId: mockUserId,
      actorId: "user-456",
      postId: "post-789",
      commentId: 100,
      actor: {
        id: "user-456",
        username: "john_doe",
        Avatar: { url: "https://example.com/avatar.png" },
      },
      post: {
        id: "post-789",
        title: "Test Post",
        type: "QUESTION",
      },
      comment: {
        id: 100,
        content: "Great post!",
        postId: "post-789",
      },
    },
    {
      id: 2,
      type: "LIKE",
      read: true,
      createdAt: new Date("2024-01-14T10:00:00Z"),
      userId: mockUserId,
      actorId: "user-789",
      postId: "post-123",
      commentId: null,
      actor: {
        id: "user-789",
        username: "jane_smith",
        Avatar: { url: "https://example.com/avatar2.png" },
      },
      post: {
        id: "post-123",
        title: "Another Post",
        type: "NOTE",
      },
      comment: null,
    },
  ];

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockRequest.user = { id: mockUserId, role: "STUDENT" };
    mockNext = vi.fn();
    mockResponse = createMockResponse();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("successful requests", () => {
    it("should return paginated notifications with default parameters", async () => {
      mockRequest.query = {};

      vi.mocked(prisma.notification.findMany).mockResolvedValue(
        mockNotifications
      );
      vi.mocked(prisma.notification.count).mockResolvedValue(1);

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [
            expect.objectContaining({
              id: 1,
              type: "COMMENT_ON_POST",
              createdAt: mockNotifications[0].createdAt,
            }),
            expect.objectContaining({
              id: 2,
              type: "LIKE",
              createdAt: mockNotifications[1].createdAt,
            }),
          ],
          pagination: {
            hasMore: false,
            nextCursor: null,
          },
          unreadCount: 1,
        })
      );
    });

    it("should return notifications with custom limit", async () => {
      mockRequest.query = { limit: "20" };

      vi.mocked(prisma.notification.findMany).mockResolvedValue(
        mockNotifications
      );
      vi.mocked(prisma.notification.count).mockResolvedValue(1);

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 21, // limit + 1 for hasMore check
        })
      );
    });

    it("should return notifications with cursor for pagination", async () => {
      mockRequest.query = { cursor: "5" };

      vi.mocked(prisma.notification.findMany).mockResolvedValue([
        mockNotifications[0],
      ]);
      vi.mocked(prisma.notification.count).mockResolvedValue(1);

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 5 },
          skip: 1,
        })
      );
    });

    it("should filter notifications by read status (unread)", async () => {
      mockRequest.query = { read: "false" };

      const unreadNotifications = [mockNotifications[0]];
      vi.mocked(prisma.notification.findMany).mockResolvedValue(
        unreadNotifications
      );
      vi.mocked(prisma.notification.count).mockResolvedValue(1);

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            read: false,
          }),
        })
      );
    });

    it("should filter notifications by read status (read)", async () => {
      mockRequest.query = { read: "true" };

      const readNotifications = [mockNotifications[1]];
      vi.mocked(prisma.notification.findMany).mockResolvedValue(
        readNotifications
      );
      vi.mocked(prisma.notification.count).mockResolvedValue(0);

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            read: true,
          }),
        })
      );
    });

    it("should filter notifications by type", async () => {
      mockRequest.query = { type: "COMMENT_ON_POST" };

      const filteredNotifications = [mockNotifications[0]];
      vi.mocked(prisma.notification.findMany).mockResolvedValue(
        filteredNotifications
      );
      vi.mocked(prisma.notification.count).mockResolvedValue(1);

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: "COMMENT_ON_POST",
          }),
        })
      );
    });

    it("should combine multiple filters (read + type)", async () => {
      mockRequest.query = { read: "false", type: "LIKE" };

      vi.mocked(prisma.notification.findMany).mockResolvedValue([]);
      vi.mocked(prisma.notification.count).mockResolvedValue(0);

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            read: false,
            type: "LIKE",
          }),
        })
      );
    });

    it("should return empty array when no notifications exist", async () => {
      mockRequest.query = {};

      vi.mocked(prisma.notification.findMany).mockResolvedValue([]);
      vi.mocked(prisma.notification.count).mockResolvedValue(0);

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
        pagination: expect.objectContaining({
          hasMore: false,
          nextCursor: null,
        }),
        unreadCount: 0,
      });
    });

    it("should return correct hasMore flag when more notifications exist", async () => {
      mockRequest.query = { limit: "2" };

      // Return 3 notifications (limit + 1)
      const moreNotifications = [...mockNotifications, mockNotifications[0]];
      vi.mocked(prisma.notification.findMany).mockResolvedValue(
        moreNotifications
      );
      vi.mocked(prisma.notification.count).mockResolvedValue(1);

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            hasMore: true,
            nextCursor: expect.any(Number),
          }),
        })
      );
    });

    it("should include unread count in response", async () => {
      mockRequest.query = {};

      vi.mocked(prisma.notification.findMany).mockResolvedValue(
        mockNotifications
      );
      vi.mocked(prisma.notification.count).mockResolvedValue(5);

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          unreadCount: 5,
        })
      );
    });
  });

  describe("validation errors", () => {
    it("should handle invalid limit parameter (too low)", async () => {
      mockRequest.query = { limit: "0" };

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should handle invalid limit parameter (too high)", async () => {
      mockRequest.query = { limit: "100" };

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should handle invalid limit parameter (not a number)", async () => {
      mockRequest.query = { limit: "invalid" };

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should handle invalid cursor parameter", async () => {
      mockRequest.query = { cursor: "invalid" };

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should handle invalid read parameter", async () => {
      mockRequest.query = { read: "invalid" };

      await getNotifications(mockRequest, mockResponse, mockNext);

      // Should throw validation error
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should handle invalid type parameter", async () => {
      mockRequest.query = { type: "INVALID_TYPE" };

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("database errors", () => {
    it("should handle database errors when fetching notifications", async () => {
      mockRequest.query = {};

      const dbError = new Error("Database connection failed");
      vi.mocked(prisma.notification.findMany).mockRejectedValue(dbError);

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should handle database errors when counting unread notifications", async () => {
      mockRequest.query = {};

      vi.mocked(prisma.notification.findMany).mockResolvedValue(
        mockNotifications
      );
      const dbError = new Error("Count query failed");
      vi.mocked(prisma.notification.count).mockRejectedValue(dbError);

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle exactly one page of notifications", async () => {
      mockRequest.query = { limit: "2" };

      // Return exactly limit notifications (no more)
      vi.mocked(prisma.notification.findMany).mockResolvedValue(
        mockNotifications
      );
      vi.mocked(prisma.notification.count).mockResolvedValue(0);

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            hasMore: false,
          }),
        })
      );
    });

    it("should handle notifications with null post and comment", async () => {
      mockRequest.query = {};

      const notificationWithNulls = [
        {
          ...mockNotifications[0],
          postId: null,
          commentId: null,
          post: null,
          comment: null,
        },
      ];

      vi.mocked(prisma.notification.findMany).mockResolvedValue(
        notificationWithNulls
      );
      vi.mocked(prisma.notification.count).mockResolvedValue(0);

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              post: null,
              comment: null,
            }),
          ]),
        })
      );
    });

    it("should only return notifications for the authenticated user", async () => {
      mockRequest.query = {};

      vi.mocked(prisma.notification.findMany).mockResolvedValue(
        mockNotifications
      );
      vi.mocked(prisma.notification.count).mockResolvedValue(1);

      await getNotifications(mockRequest, mockResponse, mockNext);

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
          }),
        })
      );
    });
  });
});
