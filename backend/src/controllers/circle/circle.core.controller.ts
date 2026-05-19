import { createLogger } from "../../core/config/logger.js";
import { circleService } from "../../features/circle/service/CircleService.js";
import { withLogging } from "../../utils/logger.util.js";
import { createPaginationSchema } from "../../utils/pagination.util.js";
import {
  StudyCircleIdParamSchema,
  CreateStudyCircleDataSchema,
  UpdateStudyCircleDataSchema,
} from "../../zodSchemas/circle.zod.js";

import type {
  AuthenticatedRequest,
  AuthenticatedEnrichedRequest,
} from "../../types/AuthRequest.js";

const controllerLogger = createLogger({
  module: "CircleSearchController",
});

const createStudyCircle = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "createStudyCircle",
  async ({ req, res, log }) => {
    log.info("Creating study circle");

    const parsed = CreateStudyCircleDataSchema.parse({
      ...req.body,
      creatorId: req.user.id,
    });

    const group = await circleService.core.createCircle(parsed);

    log.info(
      {
        groupId: group.id,
        groupName: group.name,
        creatorId: req.user.id,
      },
      "Study circle created successfully",
    );

    res.status(201).json({
      data: group,
    });
  },
);

const joinCircle = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "joinCircle",
  async ({ req, res, log }) => {
    log.info("User joining study circle");

    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    const member = await circleService.core.joinCircle(circleId, req.user.id);

    log.info(
      {
        circleId,
        userId: req.user.id,
        userRole: member.role,
      },
      "User joined study circle successfully",
    );

    res.status(200).json({
      data: member,
    });
  },
);

const leaveCircle = withLogging<AuthenticatedEnrichedRequest>(
  controllerLogger,
  "leaveCircle",
  async ({ req, res, log }) => {
    log.info("User leaving study circle");

    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    await circleService.core.leaveCircle(circleId, req.user);

    log.info(
      {
        circleId,
        userId: req.user.id,
        userRole: req.user.circleRole,
      },
      "User leaved study circle successfully",
    );

    res.status(200).json({
      message: "User leaved circle successfully",
    });
  },
);

const getCircleById = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getCircleById",
  async ({ req, res, log }) => {
    log.info("Fetching study circle by ID");
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    const circle = await circleService.core.getCircleById(
      circleId,
      req.user.id,
    );

    log.info(
      {
        circleId,
        circleName: circle.name,
        userRole: circle.userRole,
      },
      "Study circle retrieved successfully",
    );

    res.status(200).json({
      data: circle,
    });
  },
);

const getCirclePreviewDetails = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getCirclePreviewDetails",
  async ({ req, res, log }) => {
    log.info("Fetching study circle preview details");
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    const group = await circleService.core.getCirclePreviewDetails(circleId);
    log.info(
      {
        circleId,
        groupName: group.name,
        memberCount: group.memberCount,
      },
      "Study circle details retrieved successfully",
    );

    res.status(200).json({ data: group });
  },
);

const getUserCircles = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getUserCircles",
  async ({ req, res, log }) => {
    log.info("Fetching user's study circles");

    const customParser = createPaginationSchema(10, 30, "uuid");
    const { limit, cursor } = customParser.parse(req.query);

    const result = await circleService.core.getUserCircles(req.user.id, {
      limit,
      cursor: cursor as string,
    });

    log.info(
      {
        userId: req.user.id,
        pageSize: limit,
      },
      "User study circles retrieved successfully",
    );

    res.status(200).json(result);
  },
);

const getRecentActivityCircles = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getRecentActivityCircles",
  async ({ req, res, log }) => {
    log.info("Fetching recent activity study circles");

    const limit = req.query.limit ? Number(req.query.limit) : 8;

    const groups = await circleService.core.getRecentActivityCircles(
      req.user.id,
      limit,
    );
    log.info(
      {
        userId: req.user.id,
        groupCount: groups.length,
      },
      "Recent activity study circles retrieved successfully",
    );
    res.status(200).json({
      data: groups,
    });
  },
);

const updateCircle = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "updateCircle",
  async ({ req, res, log }) => {
    log.info("Updating study circle");
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const data = UpdateStudyCircleDataSchema.parse(req.body);

    const updatedGroup = await circleService.core.updateCircle(
      circleId,
      req.user,
      data,
    );

    log.info(
      {
        circleId,
        groupName: updatedGroup.name,
        userId: req.user.id,
      },
      "Study circle updated successfully",
    );

    res.status(200).json({
      data: updatedGroup,
    });
  },
);

const deleteCircle = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "deleteCircle",
  async ({ req, res, log }) => {
    log.info("Deleting Study circle");
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    await circleService.core.deleteCircle(circleId, req.user);

    log.info(
      {
        circleId,
        userId: req.user.id,
      },
      "Study circle deleted successfully",
    );

    res.status(200).json({
      message: "Study circle deleted successfully",
    });
  },
);

const getCircleAvatars = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getCircleAvatars",
  async ({ req, res, log }) => {
    log.info("Fetching study circle avatars");

    const customSchema = createPaginationSchema(20, 60, "number");
    const { limit, cursor } = customSchema.parse(req.query);

    const result = await circleService.core.getCircleAvatars(
      limit,
      cursor as number | undefined,
    );

    log.info(
      {
        userId: req.user.id,
        avatarCount: result.data.length,
      },
      "Study circle avatars retrieved successfully",
    );

    res.status(200).json(result);
  },
);

export {
  createStudyCircle,
  getCircleById,
  getUserCircles,
  updateCircle,
  deleteCircle,
  joinCircle,
  leaveCircle,
  getRecentActivityCircles,
  getCirclePreviewDetails,
  getCircleAvatars,
};
