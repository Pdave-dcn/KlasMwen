import { createLogger } from "../core/config/logger.js";
import { tagService } from "../features/tag/service/index.js";
import { withLogging } from "../utils/logger.util.js";
import { CreateTagSchema, TagIdParamSchema } from "../zodSchemas/tag.zod.js";

import type { AuthenticatedRequest } from "../types/AuthRequest.js";

const controllerLogger = createLogger({ module: "TagController" });

const createTag = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "createTag",
  async ({ req, res, log }) => {
    log.info("Received request to create a new tag");

    const { name } = CreateTagSchema.parse(req.body);
    const newTag = await tagService.createTag({ name });

    log.info("Tag created successfully with ID: %s", newTag.id);

    res.status(201).json({
      message: "New tag created successfully",
      data: newTag,
    });
  },
);

const getTagForEdit = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getTagForEdit",
  async ({ req, res, log }) => {
    log.info("Received request to fetch tag for edit");
    const { id: tagId } = TagIdParamSchema.parse(req.params);
    const tag = await tagService.getTagForEdit(tagId);
    res.status(200).json({ data: tag });
  },
);

const getAllTags = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getAllTags",
  async ({ req: _req, res, log }) => {
    log.info("Received request to fetch all tags");
    const tags = await tagService.getAllTags();
    res.status(200).json({ data: tags });
  },
);

const getPopularTags = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getPopularTags",
  async ({ req: _req, res, log }) => {
    log.info("Received request to fetch popular tags");
    const tags = await tagService.getPopularTags(10);
    res.status(200).json({ data: tags });
  },
);

const updateTag = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "updateTag",
  async ({ req, res, log }) => {
    log.info("Received request to update tag");

    const { id: tagId } = TagIdParamSchema.parse(req.params);
    const { name } = CreateTagSchema.parse(req.body);
    const updatedTag = await tagService.updateTag(tagId, { name });

    log.info("Tag with ID %s updated successfully", tagId);

    res.status(200).json({
      message: "Tag updated successfully",
      data: updatedTag,
    });
  },
);

const deleteTag = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "deleteTag",
  async ({ req, res, log }) => {
    log.info("Received request to delete tag");

    const { id: tagId } = TagIdParamSchema.parse(req.params);
    await tagService.deleteTag(tagId);

    log.info("Tag with ID %s deleted successfully", tagId);

    res.status(200).json({
      message: "Tag deleted successfully",
    });
  },
);

export {
  createTag,
  getAllTags,
  getTagForEdit,
  updateTag,
  deleteTag,
  getPopularTags,
};
