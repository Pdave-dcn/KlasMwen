import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  UserService,
  registerUser,
} from "../controllers/auth/register.controller.js";

import type { Request, Response } from "express";

vi.mock("../config/db.js", () => ({
  default: {
    user: {
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs");
vi.mock("jsonwebtoken");

const mockedBcrypt = vi.mocked(bcrypt);
const mockedJwt = vi.mocked(jwt);

describe("UserService class", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("should hash a password successfully", async () => {
      const password = "myPassword";
      const hashedPassword = "hashed_myPassword";
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as any);

      const result = await UserService.hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
    });
  });

  describe("createUser", () => {
    it("should create a user in database", async () => {
      const userData = {
        username: "john",
        email: "john@test.com",
        password: "hashed_password",
      };

      const mockUser = {
        id: "1",
        username: "john",
        password: "hashed_password",
        email: "john@test.com",
        role: "STUDENT" as const,
        bio: null,
        avatarUrl: null,
        createdAt: new Date(),
      };

      const prisma = await import("../config/db.js");
      vi.mocked(prisma.default.user.create).mockResolvedValue(mockUser);

      const result = await UserService.createUser(userData);

      expect(result).toEqual(mockUser);
      expect(prisma.default.user.create).toHaveBeenCalledWith({
        data: userData,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    });
  });

  describe("generateToken", () => {
    beforeEach(() => {
      process.env.JWT_SECRET = "test-secret";
    });

    it("should generate JWT token successfully", () => {
      const userData = {
        id: "1",
        username: "john",
        email: "john@test.com",
        role: "STUDENT",
      };
      const expectedToken = "fake_token";
      mockedJwt.sign.mockReturnValue(expectedToken as any);

      const token = UserService.generateToken(userData);

      expect(token).toBe(expectedToken);
      expect(mockedJwt.sign).toHaveBeenCalledWith(userData, "test-secret", {
        expiresIn: "3d",
      });
    });

    it("should throw error when JWT_SECRET is not defined", () => {
      delete process.env.JWT_SECRET;
      const userData = {
        id: "1",
        username: "john",
        email: "john@test.com",
        role: "STUDENT",
      };

      expect(() => UserService.generateToken(userData)).toThrow(
        "JWT_SECRET not defined in environment variables"
      );
    });
  });
});

describe("Register User Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});

    mockRequest = {
      body: {
        username: "john",
        email: "john@test.com",
        password: "Password123",
      },
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    process.env.JWT_SECRET = "test-secret";
  });

  describe("successful registration", () => {
    it("should register a new user successfully", async () => {
      const hashedPassword = "hashed_password";
      const token = "fake_token";

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as any);
      mockedJwt.sign.mockReturnValue(token as any);

      const mockUser = {
        id: "1",
        username: "john",
        password: hashedPassword,
        email: "john@test.com",
        role: "STUDENT" as const,
        bio: null,
        avatarUrl: null,
        createdAt: new Date(),
      };

      const prisma = await import("../config/db.js");
      vi.mocked(prisma.default.user.create).mockResolvedValue(mockUser);

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User created successfully",
        user: mockUser,
        token,
      });
    });
  });

  describe("validation errors", () => {
    it("should return error when email is missing", async () => {
      mockRequest.body = {
        username: "john",
        password: "Password123",
        email: "",
      };

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Validation failed",
          errors: expect.arrayContaining([
            expect.objectContaining({
              path: "email",
              message: "Email is required.",
            }),
          ]),
        })
      );
    });

    it("should return error when email is undefined", async () => {
      mockRequest.body = {
        username: "john",
        password: "Password123",
      };

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Validation failed",
          errors: expect.arrayContaining([
            expect.objectContaining({
              path: "email",
              message: "Invalid input: expected string, received undefined",
            }),
          ]),
        })
      );
    });

    it("should return error when password is too weak", async () => {
      mockRequest.body.password = "123";

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Validation failed",
        })
      );
    });

    it("should return error when username is too short", async () => {
      mockRequest.body.username = "jo";

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Validation failed",
        })
      );
    });

    it("should return error when email format is invalid", async () => {
      mockRequest.body.email = "invalid-email";

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Validation failed",
        })
      );
    });
  });

  describe("database errors", () => {
    it("should return error when username already exists", async () => {
      mockedBcrypt.hash.mockResolvedValue("hashed_password" as any);

      const duplicateError = new PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "4.0.0",
          meta: { target: ["username"] },
        }
      );

      const prisma = await import("../config/db.js");
      vi.mocked(prisma.default.user.create).mockRejectedValue(duplicateError);

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User with this username already exists.",
      });
    });

    it("should return error when email already exists", async () => {
      mockedBcrypt.hash.mockResolvedValue("hashed_password" as any);

      const duplicateError = new PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "4.0.0",
          meta: { target: ["email"] },
        }
      );

      const prisma = await import("../config/db.js");
      vi.mocked(prisma.default.user.create).mockRejectedValue(duplicateError);

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User with this email already exists.",
      });
    });

    it("should handle generic database errors", async () => {
      mockedBcrypt.hash.mockResolvedValue("hashed_password" as any);

      const genericError = new Error("Database connection failed");
      const prisma = await import("../config/db.js");
      vi.mocked(prisma.default.user.create).mockRejectedValue(genericError);

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });
});
