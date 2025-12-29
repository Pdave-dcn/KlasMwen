import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { registerUser } from "../../../src/controllers/auth/register.controller.js";
import prisma from "../../../src/core/config/db.js";
import env from "../../../src/core/config/env.js";
import { AvatarServiceError } from "../../../src/core/error/custom/avatar.error.js";
import { handleError } from "../../../src/core/error/index.js";

import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/core/config/db.js", () => ({
  default: {
    user: {
      create: vi.fn(),
    },
    avatar: {
      findMany: vi.fn(),
    },
  },
}));

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

vi.mock("bcryptjs");
vi.mock("jsonwebtoken");

const mockedBcrypt = vi.mocked(bcrypt);
const mockedJwt = vi.mocked(jwt);
const mockedHandleError = vi.mocked(handleError);

describe("Register User Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
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
        username: "johndoe",
        email: "john@example.com",
        password: "Password123!",
      },
    };

    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
      cookie: cookieSpy,
    };

    // Set environment
    process.env.JWT_SECRET = "test-secret-key";
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Registration Flow", () => {
    const hashedPassword = "$2a$12$hashedPasswordExample";
    const generatedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

    const mockDefaultAvatars = [
      { id: 1, url: "https://cdn.example.com/avatar1.png", isDefault: true },
      { id: 2, url: "https://cdn.example.com/avatar2.png", isDefault: true },
      { id: 3, url: "https://cdn.example.com/avatar3.png", isDefault: true },
    ];

    const mockCreatedUser = {
      id: "user-uuid-123",
      username: "johndoe",
      email: "john@example.com",
      password: hashedPassword,
      role: "STUDENT" as const,
      bio: null,
      avatarId: 2,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      Avatar: {
        id: 2,
        url: "https://cdn.example.com/avatar2.png",
      },
    };

    beforeEach(() => {
      // Mock bcrypt hashing
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      // Mock JWT token generation
      mockedJwt.sign.mockReturnValue(generatedToken as never);

      // Mock avatar retrieval
      vi.mocked(prisma.avatar.findMany).mockResolvedValue(mockDefaultAvatars);

      // Mock user creation
      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser);
    });

    it("should register a new user with all steps working correctly", async () => {
      await registerUser(mockRequest as Request, mockResponse as Response);

      // Verify password was hashed
      expect(mockedBcrypt.hash).toHaveBeenCalledWith("Password123!", 12);

      // Verify avatars were fetched
      expect(prisma.avatar.findMany).toHaveBeenCalledWith({
        where: { isDefault: true },
      });

      // Verify user was created with hashed password
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: "johndoe",
          email: "john@example.com",
          password: hashedPassword,
          avatarId: expect.any(Number),
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          Avatar: {
            select: { id: true, url: true },
          },
        },
      });

      // Verify token was generated
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        {
          id: mockCreatedUser.id,
          username: mockCreatedUser.username,
          email: mockCreatedUser.email,
          role: mockCreatedUser.role,
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
      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: "User registered successfully",
        user: {
          id: mockCreatedUser.id,
          username: mockCreatedUser.username,
          email: mockCreatedUser.email,
          role: mockCreatedUser.role,
          avatar: mockCreatedUser.Avatar,
        },
      });

      // Verify no errors
      expect(mockedHandleError).not.toHaveBeenCalled();
    });

    it("should set secure cookie in production environment", async () => {
      vi.spyOn(env, "NODE_ENV", "get").mockReturnValue("production");

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(cookieSpy).toHaveBeenCalledWith("token", generatedToken, {
        httpOnly: true,
        secure: true, // production environment
        sameSite: "none",
        maxAge: 3 * 24 * 60 * 60 * 1000,
        path: "/",
      });
    });

    it("should handle different usernames and emails correctly", async () => {
      mockRequest.body = {
        username: "alice_smith",
        email: "alice.smith@company.com",
        password: "SecurePass456!",
      };

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            username: "alice_smith",
            email: "alice.smith@company.com",
          }),
        })
      );

      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(mockedHandleError).not.toHaveBeenCalled();
    });
  });

  describe("Validation Errors", () => {
    it("should handle missing username", async () => {
      mockRequest.body = {
        email: "john@example.com",
        password: "Password123!",
        // username missing
      };

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockedHandleError).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalledWith(201);
      expect(jsonSpy).not.toHaveBeenCalled();
    });

    it("should handle missing email", async () => {
      mockRequest.body = {
        username: "johndoe",
        password: "Password123!",
        // email missing
      };

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockedHandleError).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalledWith(201);
    });

    it("should handle missing password", async () => {
      mockRequest.body = {
        username: "johndoe",
        email: "john@example.com",
        // password missing
      };

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockedHandleError).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalledWith(201);
    });

    it("should handle invalid email format", async () => {
      mockRequest.body = {
        username: "johndoe",
        email: "not-an-email",
        password: "Password123!",
      };

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockedHandleError).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalledWith(201);
    });

    it("should handle empty request body", async () => {
      mockRequest.body = {};

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockedHandleError).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalledWith(201);
    });
  });

  describe("Password Hashing Errors", () => {
    beforeEach(() => {
      vi.mocked(prisma.avatar.findMany).mockResolvedValue([
        { id: 1, url: "https://cdn.example.com/avatar1.png", isDefault: true },
      ]);
    });

    it("should handle bcrypt hashing failure", async () => {
      const hashError = new Error("Bcrypt hashing failed");
      mockedBcrypt.hash.mockRejectedValue(hashError);

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockedHandleError).toHaveBeenCalledWith(hashError, mockResponse);
      expect(statusSpy).not.toHaveBeenCalledWith(201);
      expect(cookieSpy).not.toHaveBeenCalled();
    });

    it("should not create user if password hashing fails", async () => {
      mockedBcrypt.hash.mockRejectedValue(new Error("Hash failed"));

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(mockedJwt.sign).not.toHaveBeenCalled();
    });
  });

  describe("Avatar Service Errors", () => {
    beforeEach(() => {
      mockedBcrypt.hash.mockResolvedValue("hashed_password" as never);
    });

    it("should handle no avatars available", async () => {
      vi.mocked(prisma.avatar.findMany).mockResolvedValue([]);

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockedHandleError).toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalledWith(201);
    });

    it("should handle avatar fetch database error", async () => {
      const dbError = new Error("Database connection failed");
      vi.mocked(prisma.avatar.findMany).mockRejectedValue(dbError);

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockedHandleError).toHaveBeenCalledWith(
        expect.any(AvatarServiceError),
        mockResponse
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe("User Creation Errors", () => {
    beforeEach(() => {
      mockedBcrypt.hash.mockResolvedValue("hashed_password" as never);
      vi.mocked(prisma.avatar.findMany).mockResolvedValue([
        { id: 1, url: "https://cdn.example.com/avatar1.png", isDefault: true },
      ]);
    });

    it("should handle duplicate username error", async () => {
      const duplicateError = new Error("Unique constraint failed on username");
      duplicateError.name = "PrismaClientKnownRequestError";
      vi.mocked(prisma.user.create).mockRejectedValue(duplicateError);

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockedHandleError).toHaveBeenCalledWith(
        duplicateError,
        mockResponse
      );
      expect(statusSpy).not.toHaveBeenCalledWith(201);
      expect(cookieSpy).not.toHaveBeenCalled();
    });

    it("should handle duplicate email error", async () => {
      const duplicateError = new Error("Unique constraint failed on email");
      duplicateError.name = "PrismaClientKnownRequestError";
      vi.mocked(prisma.user.create).mockRejectedValue(duplicateError);

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockedHandleError).toHaveBeenCalledWith(
        duplicateError,
        mockResponse
      );
      expect(statusSpy).not.toHaveBeenCalledWith(201);
    });

    it("should handle general database errors", async () => {
      const dbError = new Error("Database connection timeout");
      vi.mocked(prisma.user.create).mockRejectedValue(dbError);

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockedHandleError).toHaveBeenCalledWith(dbError, mockResponse);
      expect(mockedJwt.sign).not.toHaveBeenCalled();
    });

    it("should not generate token if user creation fails", async () => {
      vi.mocked(prisma.user.create).mockRejectedValue(
        new Error("Creation failed")
      );

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockedJwt.sign).not.toHaveBeenCalled();
      expect(cookieSpy).not.toHaveBeenCalled();
    });
  });

  describe("Token Generation Errors", () => {
    beforeEach(() => {
      mockedBcrypt.hash.mockResolvedValue("hashed_password" as never);
      vi.mocked(prisma.avatar.findMany).mockResolvedValue([
        { id: 1, url: "https://cdn.example.com/avatar1.png", isDefault: true },
      ]);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "user-123",
        username: "johndoe",
        email: "john@example.com",
        password: "hashed_password",
        role: "STUDENT" as const,
        bio: null,
        avatarId: 1,
        createdAt: new Date(),
      });
    });

    it("should handle JWT signing errors", async () => {
      const jwtError = new Error("Invalid JWT configuration");
      mockedJwt.sign.mockImplementation(() => {
        throw jwtError;
      });

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockedHandleError).toHaveBeenCalledWith(jwtError, mockResponse);
      expect(statusSpy).not.toHaveBeenCalledWith(201);
    });

    it("should not set cookie if token generation fails", async () => {
      mockedJwt.sign.mockImplementation(() => {
        throw new Error("Token generation failed");
      });

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(cookieSpy).not.toHaveBeenCalled();
      expect(jsonSpy).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      mockedBcrypt.hash.mockResolvedValue("hashed_password" as never);
      mockedJwt.sign.mockReturnValue("token" as never);
      vi.mocked(prisma.avatar.findMany).mockResolvedValue([
        { id: 1, url: "https://cdn.example.com/avatar1.png", isDefault: true },
      ]);
    });

    it("should handle special characters in username", async () => {
      mockRequest.body = {
        username: "user_name-123",
        email: "user@example.com",
        password: "Password123!",
      };

      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "user-123",
        username: "user_name-123",
        email: "user@example.com",
        password: "hashed_password",
        role: "STUDENT" as const,
        bio: null,
        avatarId: 1,
        createdAt: new Date(),
      });

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(mockedHandleError).not.toHaveBeenCalled();
    });

    it("should handle email with subdomain", async () => {
      mockRequest.body = {
        username: "johndoe",
        email: "john@mail.company.com",
        password: "Password123!",
      };

      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "user-123",
        username: "johndoe",
        email: "john@mail.company.com",
        password: "hashed_password",
        role: "STUDENT" as const,
        bio: null,
        avatarId: 1,
        createdAt: new Date(),
      });

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(mockedHandleError).not.toHaveBeenCalled();
    });

    it("should handle very long but valid inputs", async () => {
      mockRequest.body = {
        username: "a".repeat(50),
        email: `${"very".repeat(10)}@longdomain.com`,
        password: "Password123!",
      };

      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "user-123",
        username: "a".repeat(50),
        email: `${"very".repeat(10)}@longdomain.com`,
        password: "hashed_password",
        role: "STUDENT" as const,
        bio: null,
        avatarId: 1,
        createdAt: new Date(),
      });

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(mockedHandleError).not.toHaveBeenCalled();
    });
  });
});
