import { describe, it, expect, vi, beforeEach } from "vitest";

import { UserNotFoundError } from "../../../src/core/error/custom/user.error.js";
import { getUserById } from "../../../src/controllers/user/user.profile.controller.js";

import { expectValidationError } from "./shared/helpers.js";
import { createMockRequest, createMockResponse, mockUser } from "./shared/mocks.js";

const mockFindUserById = vi.fn();

vi.mock("../../../src/features/user/service/index.js", () => ({
  userQueryService: {
    findUserById: (...args: unknown[]) => mockFindUserById(...args),
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
}));

const mockBaseUser = {
  id: mockUser.id,
  username: "testuser",
  bio: "Test bio",
  role: "STUDENT",
  avatar: { id: 1, url: "http://example.com/avatar.png" },
};

describe("getUserById controller", () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it("should return user when valid ID is provided", async () => {
    mockReq.params = { id: mockUser.id };
    mockFindUserById.mockResolvedValue(mockBaseUser);

    await getUserById(mockReq, mockRes, mockNext);

    expect(mockFindUserById).toHaveBeenCalledWith(mockUser.id);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data: mockBaseUser });
  });

  it("should call next with UserNotFoundError when user not found", async () => {
    mockReq.params = { id: mockUser.id };
    mockFindUserById.mockRejectedValue(new UserNotFoundError(mockUser.id));

    await getUserById(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UserNotFoundError));
  });

  it("should handle invalid UUID format", async () => {
    await expectValidationError(getUserById, {
      params: { id: "invalid-uuid" },
    });
  });

  it("should handle missing id parameter", async () => {
    await expectValidationError(getUserById, { params: {} });
  });

  it("should forward database errors to next", async () => {
    mockReq.params = { id: mockUser.id };
    const dbError = new Error("Database connection failed");
    mockFindUserById.mockRejectedValue(dbError);

    await getUserById(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(dbError);
  });
});
