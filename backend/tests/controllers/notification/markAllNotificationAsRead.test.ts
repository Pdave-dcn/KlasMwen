import { Request, Response } from "express";
import { createMockRequest, createMockResponse } from "./shared/mocks.js";
import prisma from "../../../src/core/config/db.js";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { markAllNotificationsAsRead } from "../../../src/controllers/notification.controller.js";

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

vi.mock("../../../src/core/error/index.js", () => ({
  handleError: vi.fn(),
}));

vi.mock("../../../src/core/config/db.js", () => ({
  default: {
    notification: {
      updateMany: vi.fn(), // markAllAsRead uses updateMany
    },
  },
}));

describe("markAllNotificationsAsRead controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;
  let mockNext: any;

  const mockUserId = "user-123";

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
    it("should mark all notifications as read for the authenticated user", async () => {
      // Mock Prisma updateMany response
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 5 });

      await markAllNotificationsAsRead(mockRequest, mockResponse, mockNext);

      // Assert success response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "All notifications marked as read",
      });

      // Assert Prisma was called with the correct user filter
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          read: false,
        },
        data: {
          read: true,
        },
      });
    });

    it("should return success even if no notifications were updated", async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 0 });

      await markAllNotificationsAsRead(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(prisma.notification.updateMany).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should pass database errors to the next middleware", async () => {
      const dbError = new Error("Connection timed out");
      vi.mocked(prisma.notification.updateMany).mockRejectedValue(dbError);

      await markAllNotificationsAsRead(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should handle cases where user is not on the request", async () => {
      // Simulate unauthenticated request
      mockRequest.user = undefined as any;

      await markAllNotificationsAsRead(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(TypeError));
    });
  });
});
