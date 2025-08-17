import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  UserService,
  registerUser,
} from "../../../controllers/auth/register.controller.js";

import type { Request, Response } from "express";

vi.mock("../../../core/config/db.js", () => ({
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

      const prisma = await import("../../../core/config/db.js");
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

      const prisma = await import("../../../core/config/db.js");
      vi.mocked(prisma.default.user.create).mockResolvedValue(mockUser);

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User registered successfully",
        user: mockUser,
        token,
      });
    });
  });
});
