import prisma from "../../core/config/db.js";
import { checkAdminAuth } from "../../utils/auth.util.js";

import parseTagId from "./tagIdParser.js";

import type { Request, Response } from "express";

const findTagById = async (id: number) => {
  return await prisma.tag.findUnique({
    where: { id },
  });
};

/**
 * Validates common tag operation requirements including admin authorization,
 * tag ID parsing, and tag existence checking.
 *
 * @param {Request} req - Express request object containing user and tag ID in params
 * @param {Response} res - Express response object used to send error responses
 * @param {boolean} requireTagId - Whether a tag ID is required for this operation (default: true)
 * @return {Promise<{tagId: number, existingTag: any} | {} | null>}
 *   Returns null if validation fails (response already sent),
 *   returns {tagId, existingTag} if tag ID validation succeeds,
 *   returns {} for operations that don't require tag ID (when requireTagId is false)
 */
const validateTagOperation = async (
  req: Request,
  res: Response,
  requireTagId: boolean = true
) => {
  // Check admin authorization
  if (!checkAdminAuth(req.user)) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }

  // If tag ID is not required (e.g., for creating tags), skip ID validation
  if (!requireTagId) {
    return {};
  }

  // For operations that require a tag ID, ensure it's provided
  if (!req.params.id) {
    res.status(400).json({ message: "Tag ID is required" });
    return null;
  }

  // Parse and validate tag ID
  const tagId = parseTagId(req.params.id);
  if (tagId === null) {
    res
      .status(400)
      .json({ message: "Tag ID must be a valid positive integer" });
    return null;
  }

  // Check if tag exists
  const existingTag = await findTagById(tagId);
  if (!existingTag) {
    res.status(404).json({ message: "Tag not found" });
    return null;
  }

  return { tagId, existingTag };
};

export default validateTagOperation;
