import prisma from "../core/config/db";
import { handleError } from "../core/error/index";
import parseTagId from "../features/tag/tagIdParser.js";
import validateTagOperation from "../features/tag/tagValidationOperation.js";
import { CreateTagSchema } from "../zodSchemas/tag.zod.js";

import type { Request, Response } from "express";

const normalizeTagName = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, " ");
};

const createTag = async (req: Request, res: Response) => {
  try {
    const validation = await validateTagOperation(req, res);
    if (validation === null) return;

    const { name } = CreateTagSchema.parse(req.body);
    const normalizedName = normalizeTagName(name);

    const newTag = await prisma.tag.create({
      data: { name: normalizedName },
    });

    return res.status(201).json({
      message: "New tag created successfully",
      tag: newTag,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getTagForEdit = async (req: Request, res: Response) => {
  try {
    const validation = await validateTagOperation(req, res);
    if (validation === null) return;

    const { tagId } = validation as { tagId: number };

    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    return res.status(200).json(tag);
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getAllTags = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;
    const sortOrder = (req.query.sortOrder as "asc" | "desc") || "asc";

    const queryOptions: {
      take: number;
      orderBy: { name: "asc" | "desc" };
      cursor?: { id: number };
      skip?: number;
    } = {
      take: limit + 1,
      orderBy: { name: sortOrder },
    };

    if (cursor) {
      const cursorId = parseTagId(cursor);
      if (cursorId === null) {
        return res.status(400).json({ message: "Invalid cursor format" });
      }
      queryOptions.cursor = { id: cursorId };
      queryOptions.skip = 1;
    }

    const [tags, totalCount] = await Promise.all([
      prisma.tag.findMany(queryOptions),
      prisma.tag.count(),
    ]);

    const hasMore = tags.length > limit;
    const tagsSlice = tags.slice(0, limit);
    const nextCursor = hasMore ? tagsSlice[tagsSlice.length - 1].id : null;

    return res.status(200).json({
      tags: tagsSlice,
      pagination: {
        nextCursor,
        hasMore,
        totalCount,
      },
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const updateTag = async (req: Request, res: Response) => {
  try {
    const validation = await validateTagOperation(req, res);
    if (validation === null) return;

    const { tagId } = validation as { tagId: number };
    const { name } = CreateTagSchema.parse(req.body);
    const normalizedName = normalizeTagName(name);

    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: { name: normalizedName },
    });

    return res.status(200).json({
      message: "Tag updated successfully",
      tag: updatedTag,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const deleteTag = async (req: Request, res: Response) => {
  try {
    const validation = await validateTagOperation(req, res);
    if (validation === null) return;

    const { tagId } = validation as { tagId: number };

    await prisma.tag.delete({
      where: { id: tagId },
    });

    return res.status(200).json({
      message: "Tag deleted successfully",
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { createTag, getAllTags, getTagForEdit, updateTag, deleteTag };
