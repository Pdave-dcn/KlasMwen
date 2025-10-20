import prisma from "../core/config/db";
import { createLogger } from "../core/config/logger.js";
import { handleError } from "../core/error/index";
import validateTagOperation from "../features/tag/tagValidationOperation.js";
import createActionLogger from "../utils/logger.util.js";
import { CreateTagSchema } from "../zodSchemas/tag.zod.js";

import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "TagController" });

const normalizeTagName = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, " ");
};

const createTag = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "createTag", req);

  try {
    actionLogger.info("Tag creation attempt started");
    const startTime = Date.now();

    actionLogger.debug("Validating tag operation and authorization");
    const validationStartTime = Date.now();
    const validation = await validateTagOperation(req, res);
    if (validation === null) {
      actionLogger.warn("Tag operation validation failed - stopping execution");
      return;
    }
    const validationDuration = Date.now() - validationStartTime;

    actionLogger.debug(
      { validationDuration },
      "Tag operation validation completed"
    );

    const { name } = CreateTagSchema.parse(req.body);
    const normalizedName = normalizeTagName(name);

    actionLogger.info(
      {
        originalName: name,
        normalizedName,
        nameLength: name.length,
      },
      "Tag data validated and normalized"
    );

    actionLogger.debug("Creating tag in database");
    const dbStartTime = Date.now();
    const newTag = await prisma.tag.create({
      data: { name: normalizedName },
    });
    const dbDuration = Date.now() - dbStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        tagId: newTag.id,
        tagName: newTag.name,
        validationDuration,
        dbDuration,
        totalDuration,
      },
      "Tag created successfully"
    );

    return res.status(201).json({
      message: "New tag created successfully",
      data: newTag,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getTagForEdit = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getTagForEdit",
    req
  );

  try {
    actionLogger.info("Fetching tag for edit");
    const startTime = Date.now();

    actionLogger.debug("Validating tag operation and authorization");
    const validationStartTime = Date.now();
    const validation = await validateTagOperation(req, res);
    if (validation === null) {
      actionLogger.warn("Tag operation validation failed - stopping execution");
      return;
    }
    const validationDuration = Date.now() - validationStartTime;

    const { tagId } = validation as { tagId: number };
    actionLogger.info(
      { tagId, validationDuration },
      "Tag operation validation completed"
    );

    actionLogger.debug("Fetching tag from database");
    const dbStartTime = Date.now();
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    });
    const dbDuration = Date.now() - dbStartTime;

    if (!tag) {
      actionLogger.warn(
        { tagId, dbDuration },
        "Tag not found for edit operation"
      );
      return res.status(404).json({ message: "Tag not found" });
    }

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        tagId: tag.id,
        tagName: tag.name,
        validationDuration,
        dbDuration,
        totalDuration,
      },
      "Tag for edit retrieved successfully"
    );

    return res.status(200).json({ data: tag });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getAllTags = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "getAllTags", req);

  try {
    actionLogger.info("Fetching all tags");
    const startTime = Date.now();

    actionLogger.debug("Executing database query for tags");
    const dbStartTime = Date.now();
    const tags = await prisma.tag.findMany();
    const dbDuration = Date.now() - dbStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        totalTags: tags.length,
        dbDuration,
        totalDuration,
      },
      "All tags fetched successfully"
    );

    return res.status(200).json({
      data: tags,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

// todo: write tests for this controller method
const getPopularTags = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getPopularTags",
    req
  );

  try {
    actionLogger.info("Fetching popular tags");
    const startTime = Date.now();

    const dbStartTime = Date.now();
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { postTags: true },
        },
      },
      orderBy: {
        postTags: {
          _count: "desc",
        },
      },
      take: 10,
    });
    const dbDuration = Date.now() - dbStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        totalTags: tags.length,
        dbDuration,
        totalDuration,
      },
      "Popular tags fetched successfully"
    );

    const formatted = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      usageCount: tag._count.postTags,
    }));

    return res.status(200).json({ data: formatted });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const updateTag = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "updateTag", req);

  try {
    actionLogger.info("Tag update attempt started");
    const startTime = Date.now();

    actionLogger.debug("Validating tag operation and authorization");
    const validationStartTime = Date.now();
    const validation = await validateTagOperation(req, res);
    if (validation === null) {
      actionLogger.warn("Tag operation validation failed - stopping execution");
      return;
    }
    const validationDuration = Date.now() - validationStartTime;

    const { tagId } = validation as { tagId: number };
    const { name } = CreateTagSchema.parse(req.body);
    const normalizedName = normalizeTagName(name);

    actionLogger.info("Tag update data validated and normalized");

    actionLogger.debug("Updating tag in database");
    const dbStartTime = Date.now();
    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: { name: normalizedName },
    });
    const dbDuration = Date.now() - dbStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        tagId: updatedTag.id,
        oldName: name !== normalizedName ? name : undefined,
        newName: updatedTag.name,
        validationDuration,
        dbDuration,
        totalDuration,
      },
      "Tag updated successfully"
    );

    return res.status(200).json({
      message: "Tag updated successfully",
      data: updatedTag,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const deleteTag = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "deleteTag", req);

  try {
    actionLogger.info("Tag deletion attempt started");
    const startTime = Date.now();

    actionLogger.debug("Validating tag operation and authorization");
    const validationStartTime = Date.now();
    const validation = await validateTagOperation(req, res);
    if (validation === null) {
      actionLogger.warn("Tag operation validation failed - stopping execution");
      return;
    }
    const validationDuration = Date.now() - validationStartTime;

    const { tagId } = validation as { tagId: number };
    actionLogger.info(
      { tagId, validationDuration },
      "Tag operation validation completed"
    );

    actionLogger.debug("Deleting tag from database");
    const dbStartTime = Date.now();
    await prisma.tag.delete({
      where: { id: tagId },
    });
    const dbDuration = Date.now() - dbStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        tagId,
        validationDuration,
        dbDuration,
        totalDuration,
      },
      "Tag deleted successfully"
    );

    return res.status(200).json({
      message: "Tag deleted successfully",
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export {
  createTag,
  getAllTags,
  getTagForEdit,
  updateTag,
  deleteTag,
  getPopularTags,
};
