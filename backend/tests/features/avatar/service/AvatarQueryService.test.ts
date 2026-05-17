import { describe, it, expect, vi, beforeEach } from "vitest";

import { AvatarServiceError } from "../../../../src/core/error/custom/avatar.error.js";

const mockFindMany = vi.fn();
const mockFindDefaults = vi.fn();
const mockFindCircleAvatars = vi.fn();
const mockBuildPaginatedQuery = vi.fn();
const mockProcessPaginatedResults = vi.fn();

vi.mock("../../../../src/features/avatar/service/repositories/avatarRepository.js", () => ({
  AvatarRepository: {
    findMany: (...args: unknown[]) => mockFindMany(...args),
    findDefaults: (...args: unknown[]) => mockFindDefaults(...args),
    findCircleAvatars: (...args: unknown[]) => mockFindCircleAvatars(...args),
  },
}));

vi.mock("../../../../src/utils/pagination.util.js", () => ({
  buildPaginatedQuery: (...args: unknown[]) => mockBuildPaginatedQuery(...args),
  processPaginatedResults: (...args: unknown[]) => mockProcessPaginatedResults(...args),
}));

import { avatarQueryService } from "../../../../src/features/avatar/service/index.js";

const mockAvatars = [
  { id: 1, url: "https://example.com/avatar1.png", isDefault: false },
  { id: 2, url: "https://example.com/avatar2.png", isDefault: false },
];

const mockPaginatedResult = {
  data: mockAvatars,
  pagination: { hasMore: false, nextCursor: null },
};

describe("AvatarQueryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAvatars", () => {
    it("should return all avatars with pagination", async () => {
      mockBuildPaginatedQuery.mockReturnValue({
        where: {},
        take: 21,
      });
      mockFindMany.mockResolvedValue(mockAvatars);
      mockProcessPaginatedResults.mockReturnValue(mockPaginatedResult);

      const result = await avatarQueryService.getAvatars(20);

      expect(mockBuildPaginatedQuery).toHaveBeenCalledWith(
        {},
        { limit: 20, cursor: undefined, cursorField: "id" },
      );
      expect(mockFindMany).toHaveBeenCalledWith({}, 21, undefined);
      expect(mockProcessPaginatedResults).toHaveBeenCalledWith(mockAvatars, 20, "id");
      expect(result).toEqual(mockPaginatedResult);
    });

    it("should pass cursor to repository", async () => {
      mockBuildPaginatedQuery.mockReturnValue({
        where: {},
        take: 11,
      });
      mockFindMany.mockResolvedValue(mockAvatars);
      mockProcessPaginatedResults.mockReturnValue(mockPaginatedResult);

      await avatarQueryService.getAvatars(10, 5);

      expect(mockBuildPaginatedQuery).toHaveBeenCalledWith(
        {},
        { limit: 10, cursor: 5, cursorField: "id" },
      );
      expect(mockFindMany).toHaveBeenCalledWith({}, 11, 5);
    });
  });

  describe("getAvailableAvatars", () => {
    it("should return non-default avatars with pagination", async () => {
      mockBuildPaginatedQuery.mockReturnValue({
        where: { isDefault: false },
        take: 21,
      });
      mockFindMany.mockResolvedValue(mockAvatars);
      mockProcessPaginatedResults.mockReturnValue(mockPaginatedResult);

      const result = await avatarQueryService.getAvailableAvatars(20);

      expect(mockBuildPaginatedQuery).toHaveBeenCalledWith(
        { where: { isDefault: false } },
        { limit: 20, cursor: undefined, cursorField: "id" },
      );
      expect(mockFindMany).toHaveBeenCalledWith({ isDefault: false }, 21, undefined);
      expect(result).toEqual(mockPaginatedResult);
    });
  });

  describe("getRandomDefaultAvatar", () => {
    it("should return a random default avatar", async () => {
      const defaults = [
        { id: 1, url: "https://example.com/default1.png" },
        { id: 2, url: "https://example.com/default2.png" },
      ];
      mockFindDefaults.mockResolvedValue(defaults);

      const result = await avatarQueryService.getRandomDefaultAvatar();

      expect(mockFindDefaults).toHaveBeenCalled();
      expect(defaults).toContainEqual(result);
    });

    it("should throw when no default avatars found", async () => {
      mockFindDefaults.mockResolvedValue([]);

      await expect(
        avatarQueryService.getRandomDefaultAvatar(),
      ).rejects.toThrow(new AvatarServiceError("No default avatars found", 404));
    });

    it("should wrap database errors", async () => {
      const dbError = new Error("Database connection failed");
      mockFindDefaults.mockRejectedValue(dbError);

      await expect(
        avatarQueryService.getRandomDefaultAvatar(),
      ).rejects.toThrow(new AvatarServiceError("Failed to fetch default avatars"));
    });
  });

  describe("getRandomCircleAvatar", () => {
    it("should return a random circle avatar", async () => {
      const avatars = [
        { id: 1, url: "https://example.com/circle1.png" },
        { id: 2, url: "https://example.com/circle2.png" },
      ];
      mockFindCircleAvatars.mockResolvedValue(avatars);

      const result = await avatarQueryService.getRandomCircleAvatar();

      expect(mockFindCircleAvatars).toHaveBeenCalled();
      expect(avatars).toContainEqual(result);
    });

    it("should throw when no circle avatars found", async () => {
      mockFindCircleAvatars.mockResolvedValue([]);

      await expect(
        avatarQueryService.getRandomCircleAvatar(),
      ).rejects.toThrow(new AvatarServiceError("No circle avatars found", 404));
    });

    it("should wrap database errors", async () => {
      const dbError = new Error("Database connection failed");
      mockFindCircleAvatars.mockRejectedValue(dbError);

      await expect(
        avatarQueryService.getRandomCircleAvatar(),
      ).rejects.toThrow(
        new AvatarServiceError("Failed to fetch chat group avatars"),
      );
    });
  });
});
