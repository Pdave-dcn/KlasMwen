import { describe, it, expect, vi, beforeEach } from "vitest";

import { UserNotFoundError } from "../../../src/core/error/custom/user.error.js";
import { getActiveUser } from "../../../src/controllers/user/user.profile.controller.js";

import { expectValidationError } from "./shared/helpers.js";
import { createMockRequest, createMockResponse } from "./shared/mocks.js";

const mockGetActiveUser = vi.fn();

vi.mock("../../../src/features/user/service/index.js", () => ({
  userQueryService: {
    getActiveUser: (...args: unknown[]) => mockGetActiveUser(...args),
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

const mockServiceUser = {
  id: "u1",
  username: "testuser",
  email: "test@example.com",
  bio: "Test bio",
  role: "STUDENT",
  createdAt: new Date("2024-01-01"),
  avatar: { id: 1, url: "http://example.com/avatar.png" },
};

describe("getActiveUser controller", () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it("should return active user and 200 status", async () => {
    mockReq.user = { id: "u1", username: "testuser", role: "STUDENT" };
    mockGetActiveUser.mockResolvedValue(mockServiceUser);

    await getActiveUser(mockReq, mockRes, mockNext);

    expect(mockGetActiveUser).toHaveBeenCalledWith("u1");
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data: mockServiceUser });
  });

  it("should call next with UserNotFoundError when user does not exist", async () => {
    mockReq.user = { id: "nonexistent", username: "test", role: "STUDENT" };
    const notFoundError = new UserNotFoundError("nonexistent");
    mockGetActiveUser.mockRejectedValue(notFoundError);

    await getActiveUser(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(notFoundError);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("should handle unauthenticated request", async () => {
    await expectValidationError(getActiveUser, { user: undefined });
  });

  it("should forward database errors to next", async () => {
    mockReq.user = { id: "u1", username: "testuser", role: "STUDENT" };
    const dbError = new Error("Database connection failed");
    mockGetActiveUser.mockRejectedValue(dbError);

    await getActiveUser(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(dbError);
  });
});
