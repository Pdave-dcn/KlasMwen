import { Request, Response } from "express";
import { createMockRequest, createMockResponse } from "./shared/mocks.js";
import prisma from "../../../src/core/config/db.js";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { markNotificationAsRead } from "../../../src/controllers/notification.controller.js";

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
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("markNotificationAsRead controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;
  let mockNext: any;

  const mockUserId = "user-123";
  const mockNotificationId = 1;

  const mockNotification = {
    id: mockNotificationId,
    userId: mockUserId,
    type: "LIKE",
    read: false,
  };

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
    it("should mark notification as read successfully", async () => {
      mockRequest.params = { id: mockNotificationId.toString() };

      // 1. Mock the existence check (NotificationRepository.exists uses findUnique)
      vi.mocked(prisma.notification.findUnique).mockResolvedValue(
        mockNotification as any
      );

      // 2. Mock the update operation
      vi.mocked(prisma.notification.update).mockResolvedValue({
        ...mockNotification,
        read: true,
      } as any);

      await markNotificationAsRead(mockRequest, mockResponse, mockNext);

      // Verify success response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Notification marked as read",
      });

      // Verify prisma was called correctly
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: mockNotificationId },
        data: { read: true },
      });
    });
  });

  describe("error handling", () => {
    it("should return 404 error if notification does not exist", async () => {
      mockRequest.params = { id: "999" };

      // Mock finding nothing in DB
      vi.mocked(prisma.notification.findUnique).mockResolvedValue(null);

      await markNotificationAsRead(mockRequest, mockResponse, mockNext);

      // Should pass error to next middleware (NotificationNotFoundError)
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringContaining("NotificationNotFoundError"),
        })
      );
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should throw error if user does not own the notification (RBAC)", async () => {
      mockRequest.params = { id: mockNotificationId.toString() };

      // Mock notification belonging to someone else
      vi.mocked(prisma.notification.findUnique).mockResolvedValue({
        ...mockNotification,
        userId: "different-user-456",
      } as any);

      await markNotificationAsRead(mockRequest, mockResponse, mockNext);

      // Should fail at assertPermission
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            "User user-123 not permitted to update notifications"
          ),
        })
      );
    });

    it("should handle validation error for invalid ID format", async () => {
      mockRequest.params = { id: "not-a-number" };

      await markNotificationAsRead(mockRequest, mockResponse, mockNext);

      // Zod validation should fail and call next(error)
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "ZodError",
        })
      );
    });

    it("should handle database failures during update", async () => {
      mockRequest.params = { id: mockNotificationId.toString() };

      vi.mocked(prisma.notification.findUnique).mockResolvedValue(
        mockNotification as any
      );

      const dbError = new Error("Database connection lost");
      vi.mocked(prisma.notification.update).mockRejectedValue(dbError);

      await markNotificationAsRead(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });
});
