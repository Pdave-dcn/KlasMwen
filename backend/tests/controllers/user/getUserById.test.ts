import { Prisma } from "@prisma/client";
import { Request, Response } from "express";

import { getUserById } from "../../../src/controllers/user/user.profile.controller";
import prisma from "../../../src/core/config/db";
import { UserNotFoundError } from "../../../src/core/error/custom/user.error";
import { handleError } from "../../../src/core/error/index";

import { expectValidationError } from "./shared/helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockRequest,
  createMockResponse,
  mockUser,
} from "./shared/mocks";

vi.mock("../../../src/core/config/db.js", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    post: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    like: {
      findMany: vi.fn(),
    },
  },
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

describe("getUserById controller", () => {
  let mockReq: Request;
  let mockRes: Response;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });
  describe("Success Cases", () => {
    it("should return user when valid UUID is provided", async () => {
      mockReq.params = { id: mockUser.id };
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      await getUserById(mockReq, mockRes);

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: mockUser.id } })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should call handleError when user is not found", async () => {
      mockReq.params = { id: mockUser.id };
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await getUserById(mockReq, mockRes);

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: mockUser.id } })
      );

      expect(handleError).toHaveBeenCalledWith(
        expect.any(UserNotFoundError),
        mockRes
      );
    });
  });

  describe("Validation Errors", () => {
    it("should handle invalid UUID format in params", async () => {
      await expectValidationError(getUserById, {
        params: { id: "invalid-uuid" },
      });
    });

    it("should handle missing id parameter", async () => {
      await expectValidationError(getUserById, {
        params: {},
      });
    });

    it("should handle non-string id parameter", async () => {
      await expectValidationError(getUserById, {
        params: { id: 123 as any },
      });
    });
  });

  describe("Database Errors", () => {
    it("should handle database connection errors", async () => {
      mockReq.params = { id: mockUser.id };
      const dbError = new Error("Database connection failed");
      (prisma.user.findUnique as any).mockRejectedValue(dbError);

      await getUserById(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
    });

    it("should handle Prisma known request errors", async () => {
      mockReq.params = { id: mockUser.id };
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Database error",
        { code: "P2001", clientVersion: "5.0.0" }
      );
      (prisma.user.findUnique as any).mockRejectedValue(prismaError);

      await getUserById(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(prismaError, mockRes);
    });
  });
});
