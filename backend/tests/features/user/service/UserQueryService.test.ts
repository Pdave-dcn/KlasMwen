import { describe, it, expect, vi, beforeEach } from "vitest";

import { UserNotFoundError } from "../../../../src/core/error/custom/user.error.js";

const mockFindByIdExtended = vi.fn();
const mockFindById = vi.fn();
const mockFindByIdForSocket = vi.fn();
const mockExists = vi.fn();

vi.mock("../../../../src/features/user/service/repositories/userRepository.js", () => ({
  UserRepository: {
    findByIdExtended: (...args: unknown[]) => mockFindByIdExtended(...args),
    findById: (...args: unknown[]) => mockFindById(...args),
    findByIdForSocket: (...args: unknown[]) => mockFindByIdForSocket(...args),
    exists: (...args: unknown[]) => mockExists(...args),
  },
}));

vi.mock("../../../../src/core/config/logger.js", () => ({
  createLogger: vi.fn(() => ({
    child: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  })),
}));

import { userQueryService } from "../../../../src/features/user/service/index.js";

const mockExtendedUser = {
  id: "u1",
  username: "testuser",
  email: "test@example.com",
  bio: "Test bio",
  Avatar: { id: 1, url: "http://example.com/avatar.png" },
  role: "STUDENT",
  createdAt: new Date("2024-01-01"),
};

const mockBaseUser = {
  id: "u1",
  username: "testuser",
  bio: "Test bio",
  Avatar: { id: 1, url: "http://example.com/avatar.png" },
  role: "STUDENT",
};

const mockSocketUser = {
  id: "u1",
  username: "testuser",
  role: "STUDENT",
};

describe("UserQueryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getActiveUser", () => {
    it("should return active user when found", async () => {
      mockFindByIdExtended.mockResolvedValue(mockExtendedUser);

      const result = await userQueryService.getActiveUser("u1");

      expect(mockFindByIdExtended).toHaveBeenCalledWith("u1");
      expect(result).toEqual({
        id: "u1",
        username: "testuser",
        email: "test@example.com",
        bio: "Test bio",
        role: "STUDENT",
        createdAt: mockExtendedUser.createdAt,
        avatar: { id: 1, url: "http://example.com/avatar.png" },
      });
    });

    it("should throw UserNotFoundError when user not found", async () => {
      mockFindByIdExtended.mockResolvedValue(null);

      await expect(
        userQueryService.getActiveUser("nonexistent"),
      ).rejects.toThrow(UserNotFoundError);

      expect(mockFindByIdExtended).toHaveBeenCalledWith("nonexistent");
    });

    it("should handle user with null avatar", async () => {
      const userWithNullAvatar = { ...mockExtendedUser, Avatar: null };
      mockFindByIdExtended.mockResolvedValue(userWithNullAvatar);

      const result = await userQueryService.getActiveUser("u1");

      expect(result.avatar).toBeNull();
    });

    it("should handle user with null bio", async () => {
      const userWithNullBio = { ...mockExtendedUser, bio: null };
      mockFindByIdExtended.mockResolvedValue(userWithNullBio);

      const result = await userQueryService.getActiveUser("u1");

      expect(result.bio).toBeNull();
    });
  });

  describe("findUserById", () => {
    it("should return user when found", async () => {
      mockFindById.mockResolvedValue(mockBaseUser);

      const result = await userQueryService.findUserById("u1");

      expect(mockFindById).toHaveBeenCalledWith("u1");
      expect(result).toEqual({
        id: "u1",
        username: "testuser",
        bio: "Test bio",
        role: "STUDENT",
        avatar: { id: 1, url: "http://example.com/avatar.png" },
      });
    });

    it("should throw UserNotFoundError when user not found", async () => {
      mockFindById.mockResolvedValue(null);

      await expect(
        userQueryService.findUserById("nonexistent"),
      ).rejects.toThrow(UserNotFoundError);
    });
  });

  describe("getUserForSocket", () => {
    it("should return minimal user data for socket", async () => {
      mockFindByIdForSocket.mockResolvedValue(mockSocketUser);

      const result = await userQueryService.getUserForSocket("u1");

      expect(mockFindByIdForSocket).toHaveBeenCalledWith("u1");
      expect(result).toEqual(mockSocketUser);
    });

    it("should throw UserNotFoundError when user not found", async () => {
      mockFindByIdForSocket.mockResolvedValue(null);

      await expect(
        userQueryService.getUserForSocket("nonexistent"),
      ).rejects.toThrow(UserNotFoundError);
    });
  });

  describe("userExists", () => {
    it("should return true when user exists", async () => {
      mockExists.mockResolvedValue(true);

      const result = await userQueryService.userExists("u1");

      expect(mockExists).toHaveBeenCalledWith("u1");
      expect(result).toBe(true);
    });

    it("should throw UserNotFoundError when user does not exist", async () => {
      mockExists.mockResolvedValue(false);

      await expect(
        userQueryService.userExists("nonexistent"),
      ).rejects.toThrow(UserNotFoundError);
    });
  });
});
