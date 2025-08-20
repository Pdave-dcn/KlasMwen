import prisma from "../core/config/db";
import { handleError } from "../core/error/index";
import validateTagOperation from "../features/tag/tagValidationOperation.js";
import {
  buildPaginatedQuery,
  createPaginationSchema,
  processPaginatedResults,
} from "../utils/pagination.util";
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
      data: newTag,
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

    return res.status(200).json({ data: tag });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getAllTags = async (req: Request, res: Response) => {
  try {
    const customTagsSchema = createPaginationSchema(20, 60, "number");
    const { limit, cursor } = customTagsSchema.parse(req.query);

    const sortOrder = (req.query.sortOrder as "asc" | "desc") || "asc";

    const baseQuery = {
      orderBy: { name: sortOrder },
    };

    const paginatedQuery = buildPaginatedQuery<"tag">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
      orderBy: { name: sortOrder },
    });

    const [tags, totalCount] = await Promise.all([
      prisma.tag.findMany(paginatedQuery),
      prisma.tag.count(),
    ]);

    const { data: tagsData, pagination } = processPaginatedResults(
      tags,
      limit,
      "id"
    );

    return res.status(200).json({
      data: tagsData,
      pagination: {
        nextCursor: pagination.nextCursor,
        hasMore: pagination.hasMore,
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
      data: updatedTag,
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
