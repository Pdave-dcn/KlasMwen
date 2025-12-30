import { Request, Response, NextFunction } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireRole } from "../../src/middleware/requireRole.middleware";
import type { AuthenticatedRequest } from "../../src/types/AuthRequest";

import { createMockRequest, createMockResponse } from "./shared/mocks";

// Mock logger
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

describe("requireRole middleware", () => {
  let mockRequest: Request;
  let mockResponse: Response;
  let mockNext: NextFunction;

  const mockLog = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };

  const mockUser = {
    id: "user-123",
    username: "studentUser",
    email: "user@example.com",
    role: "STUDENT" as const,
  };

  const mockAdminUser = {
    id: "admin-456",
    username: "adminUser",
    email: "admin@example.com",
    role: "ADMIN" as const,
  };

  const mockModeratorUser = {
    id: "mod-789",
    username: "modUser",
    email: "moderator@example.com",
    role: "MODERATOR" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = createMockRequest({
      originalUrl: "/api/admin/users",
      log: mockLog,
    }) as Request;

    mockResponse = createMockResponse();
    mockNext = vi.fn();
  });

  describe("successful authorization", () => {
    it("should allow access when user has the required role", () => {
      (mockRequest as AuthenticatedRequest).user = mockAdminUser;

      const middleware = requireRole("ADMIN");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockLog.info).toHaveBeenCalledWith(
        {
          userId: mockAdminUser.id,
          role: mockAdminUser.role,
        },
        "Authorization granted"
      );
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should allow access when user has one of multiple required roles", () => {
      (mockRequest as AuthenticatedRequest).user = mockModeratorUser;

      const middleware = requireRole("ADMIN", "MODERATOR");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockLog.info).toHaveBeenCalledWith(
        {
          userId: mockModeratorUser.id,
          role: mockModeratorUser.role,
        },
        "Authorization granted"
      );
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should call next() only once on successful authorization", () => {
      (mockRequest as AuthenticatedRequest).user = mockAdminUser;

      const middleware = requireRole("ADMIN");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe("authorization failure - no user", () => {
    it("should return 403 when user is not authenticated", () => {
      // No user attached to request
      const middleware = requireRole("ADMIN");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Access denied",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should log warning when authorization attempted without user", () => {
      mockRequest.originalUrl = "/api/admin/settings";

      const middleware = requireRole("ADMIN");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockLog.warn).toHaveBeenCalledWith(
        {
          path: "/api/admin/settings",
        },
        "Authorization attempted without authenticated user"
      );
    });

    it("should not call next() when user is missing", () => {
      const middleware = requireRole("ADMIN");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return early without logging info when user is missing", () => {
      const middleware = requireRole("ADMIN");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockLog.info).not.toHaveBeenCalled();
    });
  });

  describe("authorization failure - insufficient role", () => {
    it("should return 403 when user lacks required role", () => {
      (mockRequest as AuthenticatedRequest).user = mockUser;

      const middleware = requireRole("ADMIN");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Access denied",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should log warning with user details when role check fails", () => {
      (mockRequest as AuthenticatedRequest).user = mockUser;
      mockRequest.originalUrl = "/api/admin/delete-user";

      const middleware = requireRole("ADMIN");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockLog.warn).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          role: mockUser.role,
          requiredRoles: ["ADMIN"],
          path: "/api/admin/delete-user",
        },
        "Authorization denied"
      );
    });

    it("should include all required roles in warning log", () => {
      (mockRequest as AuthenticatedRequest).user = mockUser;

      const middleware = requireRole("ADMIN", "MODERATOR");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockLog.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          requiredRoles: ["ADMIN", "MODERATOR"],
        }),
        "Authorization denied"
      );
    });

    it("should not call next() when role check fails", () => {
      (mockRequest as AuthenticatedRequest).user = mockUser;

      const middleware = requireRole("ADMIN");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should not log success when authorization fails", () => {
      (mockRequest as AuthenticatedRequest).user = mockUser;

      const middleware = requireRole("ADMIN");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockLog.info).not.toHaveBeenCalled();
    });
  });

  describe("multiple role requirements", () => {
    it("should allow ADMIN when requiring ADMIN or MODERATOR", () => {
      (mockRequest as AuthenticatedRequest).user = mockAdminUser;

      const middleware = requireRole("ADMIN", "MODERATOR");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should allow MODERATOR when requiring ADMIN or MODERATOR", () => {
      (mockRequest as AuthenticatedRequest).user = mockModeratorUser;

      const middleware = requireRole("ADMIN", "MODERATOR");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should deny USER when requiring ADMIN or MODERATOR", () => {
      (mockRequest as AuthenticatedRequest).user = mockUser;

      const middleware = requireRole("ADMIN", "MODERATOR");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should work with three or more role requirements", () => {
      (mockRequest as AuthenticatedRequest).user = mockModeratorUser;

      const middleware = requireRole("ADMIN", "MODERATOR", "STUDENT");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("single role requirement", () => {
    it("should work with single ADMIN role requirement", () => {
      (mockRequest as AuthenticatedRequest).user = mockAdminUser;

      const middleware = requireRole("ADMIN");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should work with single USER role requirement", () => {
      (mockRequest as AuthenticatedRequest).user = mockUser;

      const middleware = requireRole("STUDENT");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should work with single MODERATOR role requirement", () => {
      (mockRequest as AuthenticatedRequest).user = mockModeratorUser;

      const middleware = requireRole("MODERATOR");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("middleware factory pattern", () => {
    it("should return a middleware function", () => {
      const middleware = requireRole("ADMIN");

      expect(typeof middleware).toBe("function");
      expect(middleware.length).toBe(3); // req, res, next
    });

    it("should create independent middleware instances", () => {
      const adminMiddleware = requireRole("ADMIN");
      const moderatorMiddleware = requireRole("MODERATOR");

      expect(adminMiddleware).not.toBe(moderatorMiddleware);
    });

    it("should allow reuse of middleware instances", () => {
      const adminMiddleware = requireRole("ADMIN");

      (mockRequest as AuthenticatedRequest).user = mockAdminUser;
      adminMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);

      // Reuse same middleware
      vi.clearAllMocks();
      adminMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe("edge cases", () => {
    it("should handle undefined user.role gracefully", () => {
      (mockRequest as AuthenticatedRequest).user = {
        id: "user-999",
        username: "undefinedRoleUser",
        email: "test@example.com",
        role: undefined as any,
      };

      const middleware = requireRole("ADMIN");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it("should handle empty roles array", () => {
      (mockRequest as AuthenticatedRequest).user = mockUser;

      const middleware = requireRole();
      middleware(mockRequest, mockResponse, mockNext);

      // With empty roles, user.role won't be in the array
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it("should log correct path for different routes", () => {
      (mockRequest as AuthenticatedRequest).user = mockUser;
      mockRequest.originalUrl = "/api/reports/moderate";

      const middleware = requireRole("MODERATOR");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockLog.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "/api/reports/moderate",
        }),
        "Authorization denied"
      );
    });

    it("should return exactly once per call", () => {
      const middleware = requireRole("ADMIN");

      // Without user
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledTimes(1);
    });
  });

  describe("response format", () => {
    it("should return consistent error message for missing user", () => {
      const middleware = requireRole("ADMIN");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Access denied",
      });
    });

    it("should return consistent error message for insufficient role", () => {
      (mockRequest as AuthenticatedRequest).user = mockUser;

      const middleware = requireRole("ADMIN");
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Access denied",
      });
    });

    it("should use 403 status code for all authorization failures", () => {
      const middleware = requireRole("ADMIN");

      // Test without user
      middleware(mockRequest, mockResponse, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(403);

      // Reset and test with insufficient role
      vi.clearAllMocks();
      (mockRequest as AuthenticatedRequest).user = mockUser;
      middleware(mockRequest, mockResponse, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });
});
