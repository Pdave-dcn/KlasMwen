import prisma from "../../core/config/db.js";
import checkAdminAuth from "../../utils/adminAuthChecker.js";

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
 * @param {Request} req - Express request object containing user and optional tag ID in params
 * @param {Response} res - Express response object used to send error responses
 * @return {Promise<{tagId: number, existingTag: any} | {} | null>}
 *   Returns null if validation fails (response already sent),
 *   returns {tagId, existingTag} if tag ID validation succeeds,
 *   returns {} for operations that don't require tag ID
 */
const validateTagOperation = async (req: Request, res: Response) => {
  // Check admin authorization
  if (!checkAdminAuth(req.user)) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }

  // Parse and validate tag ID if it exists in params
  if (req.params.id) {
    const tagId = parseTagId(req.params.id);
    if (tagId === null) {
      res.status(400).json({ message: "Tag ID must be a number" });
      return null;
    }

    // Check if tag exists
    const existingTag = await findTagById(tagId);
    if (!existingTag) {
      res.status(404).json({ message: "Tag not found" });
      return null;
    }

    return { tagId, existingTag };
  }

  return {}; // For operations that don't need tag ID
};

export default validateTagOperation;
