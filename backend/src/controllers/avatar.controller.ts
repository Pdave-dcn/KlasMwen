import prisma from "../core/config/db.js";
import { createLogger } from "../core/config/logger.js";
import { handleError } from "../core/error/index.js";
import { checkAdminAuth } from "../utils/auth.util.js";
import createActionLogger from "../utils/logger.util.js";
import {
  buildPaginatedQuery,
  createPaginationSchema,
  processPaginatedResults,
} from "../utils/pagination.util.js";
import {
  AddAvatarsSchema,
  AvatarIdParamSchema,
} from "../zodSchemas/avatar.zod.js";

import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "avatarController" });

const getAvailableAvatars = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "getAvatars", req);

  try {
    actionLogger.info("Fetching available avatars");
    const startTime = Date.now();

    const customTagsSchema = createPaginationSchema(20, 60, "number");
    const { limit, cursor } = customTagsSchema.parse(req.query);

    actionLogger.debug(
      {
        limit,
        cursor,
        hasCursor: !!cursor,
      },
      "Pagination parameters parsed"
    );

    const paginatedQuery = buildPaginatedQuery<"avatar">(
      { where: { isDefault: false } },
      {
        limit,
        cursor,
        cursorField: "id",
      }
    );

    actionLogger.debug("Executing database query for available avatars");
    const dbStartTime = Date.now();
    const avatars = await prisma.avatar.findMany(paginatedQuery);
    const dbDuration = Date.now() - dbStartTime;

    actionLogger.info(
      { avatarsCount: avatars.length, dbDuration },
      "Available avatars retrieved from database"
    );

    const result = processPaginatedResults(avatars, limit);

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        totalAvatars: avatars.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        dbDuration,
        totalDuration,
      },
      "Available avatars fetched successfully"
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getAvatars = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "getAvatars", req);

  try {
    actionLogger.info("Fetching avatars");
    const startTime = Date.now();

    checkAdminAuth(req.user);
    const customTagsSchema = createPaginationSchema(20, 60, "number");
    const { limit, cursor } = customTagsSchema.parse(req.query);
    actionLogger.info("User authorized and pagination parameters parsed");

    const paginatedQuery = buildPaginatedQuery<"avatar">(
      {},
      {
        limit,
        cursor,
        cursorField: "id",
      }
    );

    actionLogger.debug("Executing database query for avatars");
    const dbStartTime = Date.now();
    const avatars = await prisma.avatar.findMany(paginatedQuery);
    const dbDuration = Date.now() - dbStartTime;

    actionLogger.info(
      { avatarsCount: avatars.length, dbDuration },
      "Avatars retrieved from database"
    );

    const result = processPaginatedResults(avatars, limit);

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        totalAvatars: avatars.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        dbDuration,
        totalDuration,
      },
      "Avatars fetched successfully"
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const addAvatar = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "addAvatar", req);
  try {
    actionLogger.info("Avatar addition attempt started");
    const startTime = Date.now();

    checkAdminAuth(req.user);
    const parsedData = AddAvatarsSchema.parse(req.body);
    actionLogger.info("User authorized and avatar data validated");

    let createdAvatars;
    const dbStartTime = Date.now();

    if (Array.isArray(parsedData)) {
      actionLogger.debug(`Adding ${parsedData.length} avatars in database`);
      createdAvatars = await prisma.avatar.createMany({
        data: parsedData.map((a) => ({
          url: a.url,
          isDefault: a.isDefault ?? false,
        })),
      });
    } else {
      actionLogger.debug("Adding single avatar in database");
      createdAvatars = await prisma.avatar.create({
        data: {
          url: parsedData.url,
          isDefault: parsedData.isDefault ?? false,
        },
      });
    }

    const dbDuration = Date.now() - dbStartTime;
    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        count: Array.isArray(parsedData) ? parsedData.length : 1,
        dbDuration,
        totalDuration,
      },
      "Avatar(s) added successfully"
    );

    return res.status(201).json({
      message: "Avatar(s) added successfully",
      data: createdAvatars,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const deleteAvatar = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "deleteAvatar",
    req
  );

  try {
    actionLogger.info("Avatar deletion attempt started");
    const startTime = Date.now();

    checkAdminAuth(req.user);
    const { id } = AvatarIdParamSchema.parse(req.params);
    actionLogger.info("User authorized and avatar ID validated");

    actionLogger.debug({ id }, "Checking if avatar exists");
    const avatar = await prisma.avatar.findUnique({
      where: { id: Number(id) },
    });

    if (!avatar) {
      actionLogger.warn({ id }, "Avatar not found");
      return res.status(404).json({ message: "Avatar not found" });
    }

    actionLogger.debug("Deleting avatar from database");
    const dbStartTime = Date.now();
    await prisma.avatar.delete({
      where: { id: Number(id) },
    });
    const dbDuration = Date.now() - dbStartTime;

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        dbDuration,
        totalDuration,
      },
      "Avatar deleted successfully"
    );

    return res.status(200).json({
      message: "Avatar deleted successfully",
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { getAvatars, addAvatar, getAvailableAvatars, deleteAvatar };
