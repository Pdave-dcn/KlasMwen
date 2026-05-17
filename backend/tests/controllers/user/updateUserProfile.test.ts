import { describe, it, expect, vi, beforeEach } from "vitest";

import { UserNotFoundError } from "../../../src/core/error/custom/user.error.js";
import { updateUserProfile } from "../../../src/controllers/user/user.profile.controller.js";

import { createAuthenticatedUser } from "./shared/helpers.js";
import { createMockRequest, createMockResponse } from "./shared/mocks.js";

const mockUpdateUserProfile = vi.fn();

vi.mock("../../../src/features/user/service/index.js", () => ({
  userCommandService: {
    updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args),
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

const authenticatedUser = createAuthenticatedUser();
const mockUpdatedServiceUser = {
  id: authenticatedUser.id,
  username: "testuser",
  email: "test@example.com",
  bio: "Updated bio",
  role: "STUDENT",
  createdAt: new Date("2024-01-01"),
  avatar: { id: 1, url: "http://example.com/avatar.png" },
};

describe("updateUserProfile controller", () => {
  let mockReq: ReturnType<typeof createMockRequest> & { user?: unknown };
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it("should update user profile and return 200", async () => {
    mockReq.user = authenticatedUser;
    mockReq.body = { bio: "Updated bio", avatarId: 1 };
    mockUpdateUserProfile.mockResolvedValue(mockUpdatedServiceUser);

    await updateUserProfile(mockReq, mockRes, mockNext);

    expect(mockUpdateUserProfile).toHaveBeenCalledWith(authenticatedUser.id, {
      bio: "Updated bio",
      avatarId: 1,
    });
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Profile updated successfully",
      user: mockUpdatedServiceUser,
    });
  });

  it("should update user profile with only bio", async () => {
    mockReq.user = authenticatedUser;
    mockReq.body = { bio: "New bio only" };
    const userWithNewBio = { ...mockUpdatedServiceUser, bio: "New bio only" };
    mockUpdateUserProfile.mockResolvedValue(userWithNewBio);

    await updateUserProfile(mockReq, mockRes, mockNext);

    expect(mockUpdateUserProfile).toHaveBeenCalledWith(authenticatedUser.id, {
      bio: "New bio only",
    });
  });

  it("should update user profile with only avatarId", async () => {
    mockReq.user = authenticatedUser;
    mockReq.body = { avatarId: 2 };
    const userWithNewAvatar = {
      ...mockUpdatedServiceUser,
      avatar: { id: 2, url: "http://example.com/new-avatar.png" },
    };
    mockUpdateUserProfile.mockResolvedValue(userWithNewAvatar);

    await updateUserProfile(mockReq, mockRes, mockNext);

    expect(mockUpdateUserProfile).toHaveBeenCalledWith(authenticatedUser.id, {
      avatarId: 2,
    });
  });

  it("should handle empty request body", async () => {
    const req: any = createMockRequest();
    req.user = authenticatedUser;
    req.body = {};
    const res = createMockResponse();
    const next = vi.fn();

    await updateUserProfile(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should handle bio that is too long", async () => {
    const req: any = createMockRequest();
    req.user = authenticatedUser;
    req.body = { bio: "x".repeat(161) };
    const res = createMockResponse();
    const next = vi.fn();

    await updateUserProfile(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should call next with UserNotFoundError when user not found", async () => {
    mockReq.user = createAuthenticatedUser({ id: "nonexistent" });
    mockReq.body = { bio: "New bio" };
    mockUpdateUserProfile.mockRejectedValue(
      new UserNotFoundError("nonexistent"),
    );

    await updateUserProfile(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UserNotFoundError));
  });

  it("should forward database errors to next", async () => {
    mockReq.user = authenticatedUser;
    mockReq.body = { bio: "New bio" };
    const dbError = new Error("Database connection failed");
    mockUpdateUserProfile.mockRejectedValue(dbError);

    await updateUserProfile(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(dbError);
  });
});
