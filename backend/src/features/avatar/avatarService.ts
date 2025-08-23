import prisma from "../../core/config/db.js";
import { AvatarServiceError } from "../../core/error/custom/avatar.error.js";

/**
 * Retrieves a random default avatar from the database.
 *
 * Fetches all avatars marked as default (isDefault: true) and returns
 * a randomly selected one. Useful for assigning default avatars to new users
 * or when users haven't selected a specific avatar.
 *
 * @async
 * @function getRandomDefaultAvatar
 * @return {Promise<Avatar>} A randomly selected default avatar object
 * @throws {AvatarServiceError} When no default avatars are found (404) or database operation fails (500)
 *
 * @example
 * ```typescript
 * try {
 *   const randomAvatar = await getRandomDefaultAvatar();
 *   console.log(randomAvatar.url); // https://example.com/default-avatar-1.png
 * } catch (error) {
 *   if (error instanceof AvatarServiceError) {
 *     console.error('Avatar service error:', error.message);
 *   }
 * }
 * ```
 */
const getRandomDefaultAvatar = async () => {
  try {
    const defaults = await prisma.avatar.findMany({
      where: { isDefault: true },
    });

    if (!defaults || defaults.length === 0)
      throw new AvatarServiceError("No default avatars found", 404);

    return defaults[Math.floor(Math.random() * defaults.length)];
  } catch (error: unknown) {
    if (error instanceof AvatarServiceError) throw error;

    throw new AvatarServiceError("Failed to fetch default avatars");
  }
};

export { getRandomDefaultAvatar };
