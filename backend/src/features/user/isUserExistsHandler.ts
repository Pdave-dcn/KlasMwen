import prisma from "../../core/config/db";

import type { Response } from "express";
import type pino from "pino";

/**
 * Ensures that a user exists in the database by their ID. If the user doesn't exist,
 * logs a warning and returns a 404 response. Otherwise, returns the user object.
 *
 * @param {string} userId - The unique identifier of the user to check
 * @param {Response} res - Express response object for sending HTTP responses
 * @param {pino.Logger} logger - Pino logger instance for logging warnings
 * @param {number} startTime - Timestamp marking the start of the request (for duration calculation)
 * @return {Promise<{id: string} | Response>} Returns the user object if found, or Express response if not found
 */
const ensureUserExists = async (
  userId: string,
  res: Response,
  logger: pino.Logger,
  startTime: number
) => {
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!userExists) {
    const totalDuration = Date.now() - startTime;
    logger.warn(
      {
        requestedUserId: userId,
        totalDuration,
      },
      "User comments and replies fetch failed - user not found"
    );

    res.status(404).json({ message: "User not found" });
    return null;
  }

  return userExists;
};

export default ensureUserExists;
