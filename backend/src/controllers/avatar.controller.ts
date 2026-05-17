import prisma from "../core/config/db.js";
import { createLogger } from "../core/config/logger.js";
import { withLogging } from "../utils/logger.util.js";
import {
  buildPaginatedQuery,
  createPaginationSchema,
  processPaginatedResults,
} from "../utils/pagination.util.js";
import {
  AddAvatarsSchema,
  AvatarIdParamSchema,
} from "../zodSchemas/avatar.zod.js";

const controllerLogger = createLogger({ module: "avatarController" });

const getAvailableAvatars = withLogging(
  controllerLogger, "getAvailableAvatars",
  async ({ req, res, log }) => {
    log.info("Fetching available avatars");

    const customTagsSchema = createPaginationSchema(20, 60, "number");
    const { limit, cursor } = customTagsSchema.parse(req.query);

    const paginatedQuery = buildPaginatedQuery<"avatar">(
      { where: { isDefault: false } },
      { limit, cursor, cursorField: "id" },
    );

    const avatars = await prisma.avatar.findMany(paginatedQuery);
    const result = processPaginatedResults(avatars, limit, "id");

    log.info(
      {
        totalAvatars: avatars.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "Available avatars fetched successfully",
    );

    res.status(200).json(result);
  },
);

const getAvatars = withLogging(
  controllerLogger, "getAvatars",
  async ({ req, res, log }) => {
    log.info("Fetching avatars");

    const customTagsSchema = createPaginationSchema(20, 60, "number");
    const { limit, cursor } = customTagsSchema.parse(req.query);

    const paginatedQuery = buildPaginatedQuery<"avatar">(
      {},
      { limit, cursor, cursorField: "id" },
    );

    const avatars = await prisma.avatar.findMany(paginatedQuery);
    const result = processPaginatedResults(avatars, limit, "id");

    log.info(
      {
        totalAvatars: avatars.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "Avatars fetched successfully",
    );

    res.status(200).json(result);
  },
);

const addAvatar = withLogging(
  controllerLogger, "addAvatar",
  async ({ req, res, log }) => {
    log.info("Avatar addition attempt started");

    const parsedData = AddAvatarsSchema.parse(req.body);

    let createdAvatars;

    if (Array.isArray(parsedData)) {
      log.debug(`Adding ${parsedData.length} avatars in database`);
      createdAvatars = await prisma.avatar.createMany({
        data: parsedData.map((a) => ({
          url: a.url,
          isDefault: a.isDefault ?? false,
        })),
      });
    } else {
      log.debug("Adding single avatar in database");
      createdAvatars = await prisma.avatar.create({
        data: {
          url: parsedData.url,
          isDefault: parsedData.isDefault ?? false,
        },
      });
    }

    log.info(
      {
        count: Array.isArray(parsedData) ? parsedData.length : 1,
      },
      "Avatar(s) added successfully",
    );

    res.status(201).json({
      message: "Avatar(s) added successfully",
      data: createdAvatars,
    });
  },
);

const deleteAvatar = withLogging(
  controllerLogger, "deleteAvatar",
  async ({ req, res, log }) => {
    log.info("Avatar deletion attempt started");

    const { id } = AvatarIdParamSchema.parse(req.params);

    log.debug({ id }, "Checking if avatar exists");
    const avatar = await prisma.avatar.findUnique({
      where: { id: Number(id) },
    });

    if (!avatar) {
      log.warn({ id }, "Avatar not found");
      res.status(404).json({ message: "Avatar not found" });
      return;
    }

    log.debug("Deleting avatar from database");
    await prisma.avatar.delete({
      where: { id: Number(id) },
    });

    log.info({}, "Avatar deleted successfully");

    res.status(200).json({
      message: "Avatar deleted successfully",
    });
  },
);

export { getAvatars, addAvatar, getAvailableAvatars, deleteAvatar };
