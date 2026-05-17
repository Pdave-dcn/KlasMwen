import { describe, it, expect, vi, beforeEach } from "vitest";

import { AvatarServiceError } from "../../../../src/core/error/custom/avatar.error.js";

const mockCreate = vi.fn();
const mockCreateMany = vi.fn();
const mockFindById = vi.fn();
const mockDelete = vi.fn();

vi.mock("../../../../src/features/avatar/service/repositories/avatarRepository.js", () => ({
  AvatarRepository: {
    create: (...args: unknown[]) => mockCreate(...args),
    createMany: (...args: unknown[]) => mockCreateMany(...args),
    findById: (...args: unknown[]) => mockFindById(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

import { avatarCommandService } from "../../../../src/features/avatar/service/index.js";

const mockAvatar = {
  id: 1,
  url: "https://example.com/avatar.png",
  isDefault: false,
};

describe("AvatarCommandService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAvatar", () => {
    it("should create a single avatar", async () => {
      mockCreate.mockResolvedValue(mockAvatar);

      const result = await avatarCommandService.createAvatar({
        url: "https://example.com/avatar.png",
      });

      expect(mockCreate).toHaveBeenCalledWith({
        url: "https://example.com/avatar.png",
      });
      expect(result).toEqual(mockAvatar);
    });

    it("should create a default avatar with isDefault true", async () => {
      const defaultAvatar = { ...mockAvatar, isDefault: true };
      mockCreate.mockResolvedValue(defaultAvatar);

      const result = await avatarCommandService.createAvatar({
        url: "https://example.com/default.png",
        isDefault: true,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        url: "https://example.com/default.png",
        isDefault: true,
      });
      expect(result.isDefault).toBe(true);
    });
  });

  describe("createAvatars", () => {
    it("should create multiple avatars", async () => {
      const mockResult = { count: 3 };
      mockCreateMany.mockResolvedValue(mockResult);

      const data = [
        { url: "https://example.com/avatar1.png" },
        { url: "https://example.com/avatar2.png", isDefault: true },
        { url: "https://example.com/avatar3.png", isDefault: false },
      ];

      const result = await avatarCommandService.createAvatars(data);

      expect(mockCreateMany).toHaveBeenCalledWith(data);
      expect(result).toEqual(mockResult);
    });
  });

  describe("deleteAvatar", () => {
    it("should delete avatar when it exists", async () => {
      mockFindById.mockResolvedValue(mockAvatar);
      mockDelete.mockResolvedValue(mockAvatar);

      await avatarCommandService.deleteAvatar(1);

      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockDelete).toHaveBeenCalledWith(1);
    });

    it("should throw when avatar not found", async () => {
      mockFindById.mockResolvedValue(null);

      await expect(
        avatarCommandService.deleteAvatar(999),
      ).rejects.toThrow(new AvatarServiceError("Avatar not found", 404));

      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});
