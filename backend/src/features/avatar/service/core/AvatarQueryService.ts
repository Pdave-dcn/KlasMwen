import { AvatarServiceError } from "../../../../core/error/custom/avatar.error.js";
import {
  buildPaginatedQuery,
  processPaginatedResults,
} from "../../../../utils/pagination.util.js";
import { AvatarRepository } from "../repositories/avatarRepository.js";

interface PaginatedAvatarResult {
  data: unknown[];
  pagination: { hasMore: boolean; nextCursor: number | null };
}

class AvatarQueryService {
  async getAvatars(limit: number, cursor?: number): Promise<PaginatedAvatarResult> {
    const paginatedQuery = buildPaginatedQuery<"avatar">(
      {},
      { limit, cursor, cursorField: "id" },
    );
    const avatars = await AvatarRepository.findMany(
      paginatedQuery.where ?? {},
      paginatedQuery.take ?? limit,
      cursor,
    );
    return processPaginatedResults(avatars, limit, "id");
  }

  async getAvailableAvatars(
    limit: number,
    cursor?: number,
  ): Promise<PaginatedAvatarResult> {
    const paginatedQuery = buildPaginatedQuery<"avatar">(
      { where: { isDefault: false } },
      { limit, cursor, cursorField: "id" },
    );
    const avatars = await AvatarRepository.findMany(
      paginatedQuery.where ?? {},
      paginatedQuery.take ?? limit,
      cursor,
    );
    return processPaginatedResults(avatars, limit, "id");
  }

  async getRandomDefaultAvatar() {
    try {
      const defaults = await AvatarRepository.findDefaults();
      if (!defaults || defaults.length === 0)
        throw new AvatarServiceError("No default avatars found", 404);
      return defaults[Math.floor(Math.random() * defaults.length)];
    } catch (error: unknown) {
      if (error instanceof AvatarServiceError) throw error;
      throw new AvatarServiceError("Failed to fetch default avatars");
    }
  }

  async getRandomCircleAvatar() {
    try {
      const avatars = await AvatarRepository.findCircleAvatars();
      if (!avatars || avatars.length === 0)
        throw new AvatarServiceError("No circle avatars found", 404);
      return avatars[Math.floor(Math.random() * avatars.length)];
    } catch (error: unknown) {
      if (error instanceof AvatarServiceError) throw error;
      throw new AvatarServiceError("Failed to fetch chat group avatars");
    }
  }
}

const avatarQueryService = new AvatarQueryService();
export { avatarQueryService, AvatarQueryService };
