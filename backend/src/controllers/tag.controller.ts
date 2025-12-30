import { createLogger } from "../core/config/logger.js";
import TagService from "../features/tag/service/TagService.js";
import createActionLogger from "../utils/logger.util.js";
import { CreateTagSchema, TagIdParamSchema } from "../zodSchemas/tag.zod.js";

import type { Request, Response, NextFunction} from "express";

const controllerLogger = createLogger({ module: "TagController" });

const createTag = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "createTag", req);

  try {
    actionLogger.info("Tag creation attempt started");
    const startTime = Date.now();

    const { name } = CreateTagSchema.parse(req.body);

    actionLogger.debug("Creating tag via service");
    const serviceStartTime = Date.now();
    const newTag = await TagService.createTag({ name });
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        tagId: newTag.id,
        tagName: newTag.name,
        serviceDuration,
        totalDuration,
      },
      "Tag created successfully"
    );

    return res.status(201).json({
      message: "New tag created successfully",
      data: newTag,
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const getTagForEdit = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getTagForEdit",
    req
  );

  try {
    actionLogger.info("Fetching tag for edit");
    const startTime = Date.now();

    const { id: tagId } = TagIdParamSchema.parse(req.params);

    actionLogger.debug("Fetching tag from service");
    const serviceStartTime = Date.now();
    const tag = await TagService.getTagForEdit(tagId);
    if (!tag) return;
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        tagId: tag.id,
        tagName: tag.name,
        serviceDuration,
        totalDuration,
      },
      "Tag for edit retrieved successfully"
    );

    return res.status(200).json({ data: tag });
  } catch (error: unknown) {
    return next(error);
  }
};

const getAllTags = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "getAllTags", req);

  try {
    actionLogger.info("Fetching all tags");
    const startTime = Date.now();

    actionLogger.debug("Executing service query for tags");
    const serviceStartTime = Date.now();
    const tags = await TagService.getAllTags();
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        totalTags: tags.length,
        serviceDuration,
        totalDuration,
      },
      "All tags fetched successfully"
    );

    return res.status(200).json({ data: tags });
  } catch (error: unknown) {
    return next(error);
  }
};

const getPopularTags = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getPopularTags",
    req
  );

  try {
    actionLogger.info("Fetching popular tags");
    const startTime = Date.now();

    const dbStartTime = Date.now();
    const tags = await TagService.getPopularTags(10);
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

    return res.status(200).json({ data: tags });
  } catch (error: unknown) {
    return next(error);
  }
};

const updateTag = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "updateTag", req);

  try {
    actionLogger.info("Tag update attempt started");
    const startTime = Date.now();

    const { id: tagId } = TagIdParamSchema.parse(req.params);
    const { name } = CreateTagSchema.parse(req.body);

    actionLogger.debug("Updating tag via service");
    const serviceStartTime = Date.now();
    const updatedTag = await TagService.updateTag(tagId, { name });
    if (!updatedTag) return;
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        tagId: updatedTag.id,
        newName: updatedTag.name,
        serviceDuration,
        totalDuration,
      },
      "Tag updated successfully"
    );

    return res.status(200).json({
      message: "Tag updated successfully",
      data: updatedTag,
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const deleteTag = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "deleteTag", req);

  try {
    actionLogger.info("Tag deletion attempt started");
    const startTime = Date.now();

    const { id: tagId } = TagIdParamSchema.parse(req.params);

    actionLogger.debug("Deleting tag via service");
    const serviceStartTime = Date.now();
    const result = await TagService.deleteTag(tagId);
    if (!result) return;
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        tagId,
        serviceDuration,
        totalDuration,
      },
      "Tag deleted successfully"
    );

    return res.status(200).json({
      message: "Tag deleted successfully",
    });
  } catch (error: unknown) {
    return next(error);
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
