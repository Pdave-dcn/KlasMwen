import { createLogger } from "../core/config/logger.js";
import {
  avatarQueryService,
  avatarCommandService,
} from "../features/avatar/service/index.js";
import { withLogging } from "../utils/logger.util.js";
import { createPaginationSchema } from "../utils/pagination.util.js";
import {
  AddAvatarSchema,
  AddAvatarsBatchSchema,
  AvatarIdParamSchema,
} from "../zodSchemas/avatar.zod.js";

const controllerLogger = createLogger({ module: "avatarController" });

const getAvailableAvatars = withLogging(
  controllerLogger,
  "getAvailableAvatars",
  async ({ req, res, log }) => {
    log.info("Fetching available avatars");

    const paginationSchema = createPaginationSchema(20, 60, "number");
    const { limit, cursor } = paginationSchema.parse(req.query);

    const result = await avatarQueryService.getAvailableAvatars(
      limit,
      cursor as number,
    );

    log.info(
      {
        totalAvatars: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "Available avatars fetched successfully",
    );

    res.status(200).json(result);
  },
);

const getAvatars = withLogging(
  controllerLogger,
  "getAvatars",
  async ({ req, res, log }) => {
    log.info("Fetching avatars");

    const paginationSchema = createPaginationSchema(20, 60, "number");
    const { limit, cursor } = paginationSchema.parse(req.query);

    const result = await avatarQueryService.getAvatars(limit, cursor as number);

    log.info(
      {
        totalAvatars: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "Avatars fetched successfully",
    );

    res.status(200).json(result);
  },
);

const addAvatar = withLogging(
  controllerLogger,
  "addAvatar",
  async ({ req, res, log }) => {
    log.info("Avatar addition attempt started");

    const parsedData = AddAvatarSchema.parse(req.body);

    log.debug("Adding single avatar in database");
    const createdAvatar = await avatarCommandService.createAvatar({
      url: parsedData.url,
      isDefault: parsedData.isDefault,
    });

    log.info({}, "Avatar added successfully");

    res.status(201).json({
      message: "Avatar(s) added successfully",
      data: createdAvatar,
    });
  },
);

const addBatchAvatars = withLogging(
  controllerLogger,
  "addBatchAvatars",
  async ({ req, res, log }) => {
    log.info("Batch avatar addition attempt started");

    const parsedData = AddAvatarsBatchSchema.parse(req.body);

    log.debug(`Adding ${parsedData.length} avatars in database`);
    const result = await avatarCommandService.createAvatars(
      parsedData.map((a) => ({
        url: a.url,
        isDefault: a.isDefault,
      })),
    );

    log.info({ count: parsedData.length }, "Avatars added successfully");

    res.status(201).json({
      message: "Avatar(s) added successfully",
      data: result,
    });
  },
);

const deleteAvatar = withLogging(
  controllerLogger,
  "deleteAvatar",
  async ({ req, res, log }) => {
    log.info("Avatar deletion attempt started");

    const { id } = AvatarIdParamSchema.parse(req.params);

    log.debug({ id }, "Deleting avatar");
    await avatarCommandService.deleteAvatar(id);

    log.info({}, "Avatar deleted successfully");
    res.status(200).json({
      message: "Avatar deleted successfully",
    });
  },
);

export {
  getAvatars,
  addAvatar,
  addBatchAvatars,
  getAvailableAvatars,
  deleteAvatar,
};
