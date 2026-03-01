import prisma from "../../core/config/db.js";
import { AvatarServiceError } from "../../core/error/custom/avatar.error.js";

/**
 * Retrieves a random default avatar from the database.
 * Used for assigning default avatars to new users.
 *
 * @return {Promise<Avatar>} A randomly selected default avatar
 * @throws {AvatarServiceError} When no default avatars found (404) or operation fails (500)
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

/**
 * Retrieves a random circle avatar from the database.
 * Used for assigning avatars to new circles.
 *
 * @return {Promise<CircleAvatar>} A randomly selected circle avatar
 * @throws {AvatarServiceError} When no circle avatars found (404) or operation fails (500)
 */
const getRandomCircleAvatar = async () => {
  try {
    const avatars = await prisma.circleAvatar.findMany();

    if (!avatars || avatars.length === 0)
      throw new AvatarServiceError("No circle avatars found", 404);

    return avatars[Math.floor(Math.random() * avatars.length)];
  } catch (error: unknown) {
    if (error instanceof AvatarServiceError) throw error;

    throw new AvatarServiceError("Failed to fetch chat group avatars");
  }
};

export { getRandomDefaultAvatar, getRandomCircleAvatar };
