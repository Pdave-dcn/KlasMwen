import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAuth } from "../../src/middleware/requireAuth.middleware";

import { createMockRequest, createMockResponse } from "./shared/mocks";

// Mock passport
vi.mock("passport", () => ({
  default: {
    authenticate: vi.fn(),
  },
}));

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

describe("requireAuth middleware", () => {
  let mockRequest: Request;
  let mockResponse: Response;
  let mockNext: NextFunction;
  let authenticateCallback: (err: unknown, user: Express.User | false) => void;

  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    role: "STUDENT" as const,
  };

  const mockLog = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = createMockRequest({
      originalUrl: "/api/test",
      ip: "127.0.0.1",
      log: mockLog,
    }) as Request;

    mockResponse = createMockResponse();
    mockNext = vi.fn();

    // Mock passport.authenticate to capture the callback and return a function
    vi.mocked(passport.authenticate).mockImplementation(
      (strategy: any, options: any, callback: any) => {
        authenticateCallback = callback;
        return (req: Request, res: Response, next: NextFunction) => {
          // Return value to allow test to invoke the callback
        };
      }
    );
  });

  describe("successful authentication", () => {
    it("should authenticate user and call next()", () => {
      requireAuth(mockRequest, mockResponse, mockNext);

      // Simulate successful authentication
      authenticateCallback(null, mockUser);

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockLog.info).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          role: mockUser.role,
        },
        "User authenticated successfully"
      );
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should set req.user with correct user data", () => {
      requireAuth(mockRequest, mockResponse, mockNext);

      authenticateCallback(null, mockUser);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user).toHaveProperty("id", mockUser.id);
      expect(mockRequest.user).toHaveProperty("email", mockUser.email);
      expect(mockRequest.user).toHaveProperty("role", mockUser.role);
    });

    it("should log authentication success with userId and role", () => {
      requireAuth(mockRequest, mockResponse, mockNext);

      authenticateCallback(null, mockUser);

      expect(mockLog.info).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          role: mockUser.role,
        }),
        "User authenticated successfully"
      );
    });
  });

  describe("authentication failure - no user", () => {
    it("should return 401 when user is false", () => {
      requireAuth(mockRequest, mockResponse, mockNext);

      authenticateCallback(null, false);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthenticated",
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it("should log warning with request details when authentication fails", () => {
      mockRequest = createMockRequest({
        originalUrl: "/api/protected/resource",
        ip: "192.168.1.100",
        log: mockLog,
      }) as Request;

      requireAuth(mockRequest, mockResponse, mockNext);

      authenticateCallback(null, false);

      expect(mockLog.warn).toHaveBeenCalledWith(
        {
          path: "/api/protected/resource",
          ip: "192.168.1.100",
        },
        "Unauthenticated request"
      );
    });

    it("should not call next() when authentication fails", () => {
      requireAuth(mockRequest, mockResponse, mockNext);

      authenticateCallback(null, false);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("authentication error", () => {
    it("should call next with error when JWT validation fails", () => {
      const authError = new Error("Invalid token");

      requireAuth(mockRequest, mockResponse, mockNext);

      authenticateCallback(authError, false);

      expect(mockLog.error).toHaveBeenCalledWith(
        { err: authError },
        "JWT authentication error"
      );
      expect(mockNext).toHaveBeenCalledWith(authError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should handle token expiration error", () => {
      const expiredError = new Error("Token expired");

      requireAuth(mockRequest, mockResponse, mockNext);

      authenticateCallback(expiredError, false);

      expect(mockLog.error).toHaveBeenCalledWith(
        { err: expiredError },
        "JWT authentication error"
      );
      expect(mockNext).toHaveBeenCalledWith(expiredError);
    });

    it("should handle malformed token error", () => {
      const malformedError = new Error("Malformed JWT");

      requireAuth(mockRequest, mockResponse, mockNext);

      authenticateCallback(malformedError, false);

      expect(mockLog.error).toHaveBeenCalledWith(
        { err: malformedError },
        "JWT authentication error"
      );
      expect(mockNext).toHaveBeenCalledWith(malformedError);
    });

    it("should not set req.user when error occurs", () => {
      const authError = new Error("Authentication failed");

      requireAuth(mockRequest, mockResponse, mockNext);

      authenticateCallback(authError, false);

      expect(mockRequest.user).toBeUndefined();
    });
  });

  describe("passport.authenticate configuration", () => {
    it("should call passport.authenticate with jwt strategy", () => {
      requireAuth(mockRequest, mockResponse, mockNext);

      expect(passport.authenticate).toHaveBeenCalledWith(
        "jwt",
        { session: false },
        expect.any(Function)
      );
    });

    it("should configure passport with session: false for stateless auth", () => {
      requireAuth(mockRequest, mockResponse, mockNext);

      expect(passport.authenticate).toHaveBeenCalledWith(
        "jwt",
        expect.objectContaining({ session: false }),
        expect.any(Function)
      );
    });

    it("should pass req, res, next to passport authenticate function", () => {
      const authenticateFn = vi.fn();
      vi.mocked(passport.authenticate).mockReturnValue(authenticateFn as any);

      requireAuth(mockRequest, mockResponse, mockNext);

      expect(authenticateFn).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        mockNext
      );
    });
  });

  describe("edge cases", () => {
    it("should handle user with different roles", () => {
      const adminUser = { ...mockUser, role: "ADMIN" as const };

      requireAuth(mockRequest, mockResponse, mockNext);

      authenticateCallback(null, adminUser);

      expect(mockRequest.user).toEqual(adminUser);
      expect(mockLog.info).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "ADMIN",
        }),
        "User authenticated successfully"
      );
    });

    it("should handle missing IP address in request", () => {
      mockRequest = createMockRequest({
        originalUrl: "/api/test",
        log: mockLog,
      }) as Request;

      requireAuth(mockRequest, mockResponse, mockNext);

      authenticateCallback(null, false);

      expect(mockLog.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: undefined,
        }),
        "Unauthenticated request"
      );
    });

    it("should handle null error (no error)", () => {
      requireAuth(mockRequest, mockResponse, mockNext);

      authenticateCallback(null, mockUser);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockLog.error).not.toHaveBeenCalled();
    });
  });
});
