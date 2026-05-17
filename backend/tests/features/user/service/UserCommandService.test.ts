import { describe, it, expect, vi, beforeEach } from "vitest";

import { UserNotFoundError } from "../../../../src/core/error/custom/user.error.js";

const mockCreateUser = vi.fn();
const mockExists = vi.fn();
const mockUpdateProfile = vi.fn();
const mockBcryptHash = vi.fn();
const mockJwtSign = vi.fn();
const mockGetRandomDefaultAvatar = vi.fn();

vi.mock(
  "../../../../src/features/user/service/repositories/userRepository.js",
  () => ({
    UserRepository: {
      createUser: (...args: unknown[]) => mockCreateUser(...args),
      exists: (...args: unknown[]) => mockExists(...args),
      updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
    },
  }),
);

vi.mock("bcryptjs", () => ({
  default: {
    hash: (...args: unknown[]) => mockBcryptHash(...args),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: (...args: unknown[]) => mockJwtSign(...args),
  },
}));

vi.mock("../../../../src/features/avatar/service/index.js", () => ({
  avatarQueryService: {
    getRandomDefaultAvatar: (...args: unknown[]) =>
      mockGetRandomDefaultAvatar(...args),
  },
}));

vi.mock("../../../../src/core/config/env.js", () => ({
  default: {
    JWT_SECRET: "test-secret",
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

import { userCommandService } from "../../../../src/features/user/service/index.js";

import type {
  RegisterUserData,
  UpdateUserProfileData,
} from "../../../../src/features/user/service/types/userTypes.js";

describe("UserCommandService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registerUser", () => {
    const userData: RegisterUserData = {
      username: "newuser",
      email: "new@example.com",
      password: "plainpassword",
    };

    const mockAvatar = {
      id: 5,
      url: "http://example.com/avatar.png",
      isDefault: true,
    };
    const mockCreatedUser = {
      id: "u-new",
      username: "newuser",
      email: "new@example.com",
      role: "STUDENT",
      Avatar: { id: 5, url: "http://example.com/avatar.png" },
    };
    const mockToken = "jwt.token.here";

    it("should register a new user successfully", async () => {
      mockBcryptHash.mockResolvedValue("hashedpassword");
      mockGetRandomDefaultAvatar.mockResolvedValue(mockAvatar);
      mockCreateUser.mockResolvedValue(mockCreatedUser);
      mockJwtSign.mockReturnValue(mockToken);

      const result = await userCommandService.registerUser(userData);

      expect(mockBcryptHash).toHaveBeenCalledWith("plainpassword", 12);
      expect(mockGetRandomDefaultAvatar).toHaveBeenCalledOnce();
      expect(mockCreateUser).toHaveBeenCalledWith({
        username: "newuser",
        email: "new@example.com",
        password: "hashedpassword",
        avatarId: 5,
      });
      expect(mockJwtSign).toHaveBeenCalledWith(
        {
          id: "u-new",
          username: "newuser",
          email: "new@example.com",
          role: "STUDENT",
        },
        "test-secret",
        { expiresIn: "3d" },
      );
      expect(result).toEqual({
        user: {
          id: "u-new",
          username: "newuser",
          email: "new@example.com",
          role: "STUDENT",
          avatar: { id: 5, url: "http://example.com/avatar.png" },
        },
        token: mockToken,
      });
    });

    it("should use bcrypt with 12 salt rounds", async () => {
      mockBcryptHash.mockResolvedValue("hashedpassword");
      mockGetRandomDefaultAvatar.mockResolvedValue(mockAvatar);
      mockCreateUser.mockResolvedValue(mockCreatedUser);
      mockJwtSign.mockReturnValue(mockToken);

      await userCommandService.registerUser(userData);

      expect(mockBcryptHash).toHaveBeenCalledWith(expect.any(String), 12);
    });

    it("should throw when bcrypt fails", async () => {
      const hashError = new Error("Hashing failed");
      mockBcryptHash.mockRejectedValue(hashError);

      await expect(userCommandService.registerUser(userData)).rejects.toThrow(
        "Hashing failed",
      );
    });
  });

  describe("processLogin", () => {
    const passportUser = {
      id: "u1",
      username: "testuser",
      email: "test@example.com",
      role: "STUDENT",
      password: "hashedpassword",
      Avatar: { id: 1, url: "http://example.com/avatar.png" },
    };

    const mockToken = "login.jwt.token";

    it("should process login successfully", () => {
      mockJwtSign.mockReturnValue(mockToken);

      const result = userCommandService.processLogin(passportUser);

      expect(mockJwtSign).toHaveBeenCalledWith(
        {
          id: "u1",
          username: "testuser",
          email: "test@example.com",
          role: "STUDENT",
        },
        "test-secret",
        { expiresIn: "3d" },
      );
      expect(result).toEqual({
        user: {
          id: "u1",
          username: "testuser",
          email: "test@example.com",
          role: "STUDENT",
          avatar: { id: 1, url: "http://example.com/avatar.png" },
        },
        token: mockToken,
      });
    });

    it("should handle user without avatar", () => {
      const userWithoutAvatar = { ...passportUser, Avatar: null };
      mockJwtSign.mockReturnValue(mockToken);

      const result = userCommandService.processLogin(userWithoutAvatar);

      expect(result.user.avatar).toBeNull();
    });
  });

  describe("updateUserProfile", () => {
    const profileData: UpdateUserProfileData = {
      bio: "Updated bio",
      avatarId: 2,
    };

    const mockUpdatedUser = {
      id: "u1",
      username: "testuser",
      email: "test@example.com",
      bio: "Updated bio",
      Avatar: { id: 2, url: "http://example.com/new-avatar.png" },
      role: "STUDENT",
      createdAt: new Date("2024-01-01"),
    };

    it("should update user profile successfully", async () => {
      mockExists.mockResolvedValue(true);
      mockUpdateProfile.mockResolvedValue(mockUpdatedUser);

      const result = await userCommandService.updateUserProfile(
        "u1",
        profileData,
      );

      expect(mockExists).toHaveBeenCalledWith("u1");
      expect(mockUpdateProfile).toHaveBeenCalledWith("u1", profileData);
      expect(result).toEqual({
        id: "u1",
        username: "testuser",
        email: "test@example.com",
        bio: "Updated bio",
        role: "STUDENT",
        createdAt: mockUpdatedUser.createdAt,
        avatar: { id: 2, url: "http://example.com/new-avatar.png" },
      });
    });

    it("should throw UserNotFoundError when user does not exist", async () => {
      mockExists.mockResolvedValue(false);

      await expect(
        userCommandService.updateUserProfile("nonexistent", profileData),
      ).rejects.toThrow(UserNotFoundError);

      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("should handle clearing bio when bio is null", async () => {
      const clearBioData: UpdateUserProfileData = {
        bio: null as any,
        avatarId: undefined as unknown as number,
      };
      const userWithNullBio = { ...mockUpdatedUser, bio: null };

      mockExists.mockResolvedValue(true);
      mockUpdateProfile.mockResolvedValue(userWithNullBio);

      const result = await userCommandService.updateUserProfile(
        "u1",
        clearBioData,
      );

      expect(mockUpdateProfile).toHaveBeenCalledWith("u1", clearBioData);
      expect(result.bio).toBeNull();
    });
  });
});
