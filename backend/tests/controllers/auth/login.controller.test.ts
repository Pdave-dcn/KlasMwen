import jwt from "jsonwebtoken";
import passport from "passport";

import { loginUser } from "../../../src/controllers/auth/login.controller.js";
import env from "../../../src/core/config/env.js";
import type { NextFunction, Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("passport");

vi.mock("jsonwebtoken");

vi.mock("../../../src/core/error/index.js", () => ({
  handleError: vi.fn(),
}));

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
}));

const mockedPassport = vi.mocked(passport);
const mockedJwt = vi.mocked(jwt);

describe("Login Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;
  let cookieSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Setup response spies
    jsonSpy = vi.fn();
    statusSpy = vi.fn().mockReturnThis();
    cookieSpy = vi.fn().mockReturnThis();

    mockRequest = {
      body: {
        email: "john@example.com",
        password: "Password123!",
      },
    };

    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
      cookie: cookieSpy,
    };

    mockNext = vi.fn();

    // Default environment setup
    process.env.JWT_SECRET = "test-secret-key";
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Login Flow", () => {
    const mockUser = {
      id: "user-uuid-123",
      username: "johndoe",
      email: "john@example.com",
      password: "$2a$12$hashedPasswordExample",
      role: "STUDENT",
      Avatar: {
        id: 1,
        url: "https://cdn.example.com/avatar1.png",
      },
    };

    const generatedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

    beforeEach(() => {
      mockedJwt.sign.mockReturnValue(generatedToken as never);
    });

    it("should login user successfully with complete flow", () => {
      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        // Simulate successful passport authentication
        callback(null, mockUser, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify passport was called correctly
      expect(mockedPassport.authenticate).toHaveBeenCalledWith(
        "local",
        { session: false },
        expect.any(Function)
      );

      // Verify token was generated
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
        },
        expect.any(String),
        { expiresIn: "3d" }
      );

      // Verify cookie was set
      expect(cookieSpy).toHaveBeenCalledWith("token", generatedToken, {
        httpOnly: true,
        secure: false, // test environment
        sameSite: "lax",
        maxAge: 3 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      // Verify response
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: "Login successful",
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
          avatar: mockUser.Avatar,
        },
      });

      // Verify no errors
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should set secure cookie in production environment", () => {
      vi.spyOn(env, "NODE_ENV", "get").mockReturnValue("production");

      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, mockUser, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(cookieSpy).toHaveBeenCalledWith("token", generatedToken, {
        httpOnly: true,
        secure: true, // production environment
        sameSite: "none",
        maxAge: 3 * 24 * 60 * 60 * 1000,
        path: "/",
      });
    });

    it("should return user with avatar when avatar exists", () => {
      const userWithAvatar = {
        ...mockUser,
        Avatar: {
          id: 5,
          url: "https://cdn.example.com/custom-avatar.png",
        },
      };

      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, userWithAvatar, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalledWith({
        message: "Login successful",
        user: expect.objectContaining({
          avatar: {
            id: 5,
            url: "https://cdn.example.com/custom-avatar.png",
          },
        }),
      });
    });

    it("should handle user with null avatar", () => {
      const userWithoutAvatar = {
        ...mockUser,
        Avatar: null,
      };

      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, userWithoutAvatar, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalledWith({
        message: "Login successful",
        user: expect.objectContaining({
          avatar: null,
        }),
      });
    });

    it("should handle different user roles correctly", () => {
      const adminUser = {
        ...mockUser,
        role: "ADMIN",
      };

      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, adminUser, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "ADMIN",
        }),
        expect.any(String),
        { expiresIn: "3d" }
      );

      expect(jsonSpy).toHaveBeenCalledWith({
        message: "Login successful",
        user: expect.objectContaining({
          role: "ADMIN",
        }),
      });
    });
  });

  describe("Authentication Failures", () => {
    it("should return 401 when credentials are invalid", () => {
      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, false, { message: "Invalid password" });
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: "Invalid password",
      });

      expect(cookieSpy).not.toHaveBeenCalled();
      expect(mockedJwt.sign).not.toHaveBeenCalled();
    });

    it("should return default message when info is undefined", () => {
      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, false, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: "Invalid credentials",
      });
    });

    it("should handle user not found", () => {
      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, false, { message: "User not found" });
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: "User not found",
      });

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle incorrect email", () => {
      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, false, { message: "Invalid email" });
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: "Invalid email",
      });
    });

    it("should not generate token on failed authentication", () => {
      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, false, { message: "Invalid credentials" });
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedJwt.sign).not.toHaveBeenCalled();
      expect(cookieSpy).not.toHaveBeenCalled();
    });
  });

  describe("Authentication Errors", () => {
    it("should call next with error when authentication error occurs", () => {
      const authError = new Error("Database connection failed");
      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(authError, null, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(authError);
      expect(statusSpy).not.toHaveBeenCalled();
      expect(jsonSpy).not.toHaveBeenCalled();
      expect(cookieSpy).not.toHaveBeenCalled();
    });

    it("should handle passport strategy errors", () => {
      const strategyError = new Error("Passport strategy not configured");
      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(strategyError, null, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(strategyError);
    });

    it("should handle database query errors", () => {
      const dbError = new Error("User query failed");
      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(dbError, null, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockedJwt.sign).not.toHaveBeenCalled();
    });
  });

  describe("Token Generation Errors", () => {
    const mockUser = {
      id: "user-123",
      username: "johndoe",
      email: "john@example.com",
      password: "hashed",
      role: "STUDENT",
      Avatar: {
        id: 1,
        url: "https://cdn.example.com/avatar1.png",
      },
    };

    it("should handle JWT signing errors", () => {
      const jwtError = new Error("Invalid JWT configuration");
      mockedJwt.sign.mockImplementation(() => {
        throw jwtError;
      });

      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, mockUser, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(jwtError);
      expect(cookieSpy).not.toHaveBeenCalled();
    });

    it("should not set cookie if token generation fails", () => {
      mockedJwt.sign.mockImplementation(() => {
        throw new Error("Token generation failed");
      });

      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, mockUser, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(cookieSpy).not.toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalledWith(200);
    });
  });

  describe("Passport Integration", () => {
    it("should call passport.authenticate with correct strategy", () => {
      const mockAuthenticate = vi.fn(() => vi.fn());
      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedPassport.authenticate).toHaveBeenCalledWith(
        "local",
        { session: false },
        expect.any(Function)
      );
    });

    it("should return function that gets called with req, res, next", () => {
      const mockPassportFunction = vi.fn();
      const mockAuthenticate = vi.fn(() => mockPassportFunction);
      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockPassportFunction).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        mockNext
      );
    });

    it("should pass session: false to passport", () => {
      const mockAuthenticate = vi.fn(() => vi.fn());
      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      const callArgs = mockedPassport.authenticate.mock.calls[0];
      expect(callArgs[1]).toEqual({ session: false });
    });
  });

  describe("User Data Handling", () => {
    it("should not expose password in response", () => {
      const mockUser = {
        id: "user-123",
        username: "johndoe",
        email: "john@example.com",
        password: "$2a$12$hashedPasswordShouldNotBeExposed",
        role: "STUDENT",
        Avatar: {
          id: 1,
          url: "https://cdn.example.com/avatar1.png",
        },
      };

      mockedJwt.sign.mockReturnValue("token" as never);

      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, mockUser, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalledWith({
        message: "Login successful",
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
          avatar: mockUser.Avatar,
        },
      });

      // Ensure password is not in response
      const responseUser = jsonSpy.mock.calls[0][0].user;
      expect(responseUser).not.toHaveProperty("password");
    });

    it("should only return safe user fields", () => {
      const mockUser = {
        id: "user-123",
        username: "johndoe",
        email: "john@example.com",
        password: "hashed_password",
        role: "STUDENT",
        bio: "Some bio that should not be exposed",
        createdAt: new Date(),
        updatedAt: new Date(),
        Avatar: {
          id: 1,
          url: "https://cdn.example.com/avatar1.png",
        },
      } as any;

      mockedJwt.sign.mockReturnValue("token" as never);

      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, mockUser, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      const responseUser = jsonSpy.mock.calls[0][0].user;
      expect(Object.keys(responseUser)).toEqual([
        "id",
        "username",
        "email",
        "role",
        "avatar",
      ]);
    });

    it("should handle user with additional properties correctly", () => {
      const mockUser = {
        id: "user-123",
        username: "johndoe",
        email: "john@example.com",
        password: "hashed",
        role: "TEACHER",
        someOtherField: "should not appear",
        Avatar: {
          id: 2,
          url: "https://cdn.example.com/avatar2.png",
        },
      } as any;

      mockedJwt.sign.mockReturnValue("token" as never);

      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, mockUser, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalledWith({
        message: "Login successful",
        user: {
          id: "user-123",
          username: "johndoe",
          email: "john@example.com",
          role: "TEACHER",
          avatar: mockUser.Avatar,
        },
      });
    });
  });

  describe("Request Body Validation", () => {
    it("should handle request with email and password", () => {
      const mockUser = {
        id: "user-123",
        username: "johndoe",
        email: "john@example.com",
        password: "hashed",
        role: "STUDENT",
        Avatar: null,
      };

      mockedJwt.sign.mockReturnValue("token" as never);

      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, mockUser, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      mockRequest.body = {
        email: "john@example.com",
        password: "Password123!",
      };

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedPassport.authenticate).toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(200);
    });

    it("should handle request with username instead of email", () => {
      const mockUser = {
        id: "user-123",
        username: "johndoe",
        email: "john@example.com",
        password: "hashed",
        role: "STUDENT",
        Avatar: null,
      };

      mockedJwt.sign.mockReturnValue("token" as never);

      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, mockUser, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      mockRequest.body = {
        username: "johndoe",
        password: "Password123!",
      };

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedPassport.authenticate).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing request body gracefully", () => {
      mockRequest.body = undefined;

      const mockAuthenticate = vi.fn(() => vi.fn());
      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedPassport.authenticate).toHaveBeenCalled();
    });

    it("should handle empty request body", () => {
      mockRequest.body = {};

      const mockAuthenticate = vi.fn(() => vi.fn());
      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedPassport.authenticate).toHaveBeenCalled();
    });

    it("should handle missing logContext", () => {
      delete (mockRequest as any).logContext;

      const mockUser = {
        id: "user-123",
        username: "johndoe",
        email: "john@example.com",
        password: "hashed",
        role: "STUDENT",
        Avatar: null,
      };

      mockedJwt.sign.mockReturnValue("token" as never);

      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, mockUser, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      expect(() => {
        loginUser(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();

      expect(statusSpy).toHaveBeenCalledWith(200);
    });
  });

  describe("Integration Flow Order", () => {
    it("should execute steps in correct order on success", () => {
      const executionOrder: string[] = [];

      const mockUser = {
        id: "user-123",
        username: "johndoe",
        email: "john@example.com",
        password: "hashed",
        role: "STUDENT",
        Avatar: {
          id: 1,
          url: "https://cdn.example.com/avatar1.png",
        },
      };

      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        executionOrder.push("authenticate");
        callback(null, mockUser, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      mockedJwt.sign.mockImplementation(() => {
        executionOrder.push("token");
        return "token" as never;
      });

      cookieSpy.mockImplementation(() => {
        executionOrder.push("cookie");
        return mockResponse as Response;
      });

      statusSpy.mockImplementation(() => {
        executionOrder.push("status");
        return mockResponse as Response;
      });

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(executionOrder).toEqual([
        "authenticate",
        "token",
        "cookie",
        "status",
      ]);
    });

    it("should stop flow after authentication failure", () => {
      const executionOrder: string[] = [];

      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        executionOrder.push("authenticate");
        callback(null, false, { message: "Invalid credentials" });
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate as any);

      mockedJwt.sign.mockImplementation(() => {
        executionOrder.push("token");
        return "token" as never;
      });

      loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(executionOrder).toEqual(["authenticate"]);
      expect(executionOrder).not.toContain("token");
    });
  });
});
