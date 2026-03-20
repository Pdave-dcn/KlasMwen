import { createLogger } from "../../core/config/logger.js";
import CircleService from "../../features/circle/service/CircleService.js";
import createActionLogger from "../../utils/logger.util.js";
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
import type { NextFunction, Request, Response } from "express";

const controllerLogger = createLogger({
  module: "CircleSearchController",
});

const createStudyCircle = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "createStudyCircle",
    req,
  );

  try {
    actionLogger.info("Creating study circle");
    const { user } = req as AuthenticatedRequest;

    const parsed = CreateStudyCircleDataSchema.parse({
      ...req.body,
      creatorId: user.id,
    });

    const group = await CircleService.createCircle(parsed);

    actionLogger.info(
      {
        groupId: group.id,
        groupName: group.name,
        creatorId: user.id,
      },
      "Study circle created successfully",
    );

    return res.status(201).json({
      data: group,
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const joinCircle = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "joinCircle", req);

  try {
    actionLogger.info("User joining study circle");

    const { user } = req as AuthenticatedRequest;
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    const group = await CircleService.joinCircle(circleId, user.id);

    actionLogger.info(
      {
        circleId,
        groupName: group.name,
        userId: user.id,
        userRole: group.userRole,
      },
      "User joined study circle successfully",
    );

    return res.status(200).json({
      data: group,
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const leaveCircle = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "leaveCircle", req);

  try {
    actionLogger.info("User leaving study circle");

    const { user } = req as AuthenticatedEnrichedRequest;
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    await CircleService.leaveCircle(circleId, user);

    actionLogger.info(
      {
        circleId,
        userId: user.id,
        userRole: user.circleRole,
      },
      "User leaved study circle successfully",
    );

    return res.status(200).json({
      message: "User leaved circle successfully",
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const getCircleById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getCircleById",
    req,
  );

  try {
    actionLogger.info("Fetching study circle by ID");
    const { user } = req as AuthenticatedRequest;
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    const circle = await CircleService.getCircleById(circleId, user.id);

    actionLogger.info(
      {
        circleId,
        circleName: circle.name,
        userRole: circle.userRole,
      },
      "Study circle retrieved successfully",
    );

    return res.status(200).json({
      data: circle,
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const getCirclePreviewDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getCirclePreviewDetails",
    req,
  );
  try {
    actionLogger.info("Fetching study circle preview details");
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    const group = await CircleService.getCirclePreviewDetails(circleId);
    actionLogger.info(
      {
        circleId,
        groupName: group.name,
        memberCount: group.memberCount,
      },
      "Study circle details retrieved successfully",
    );

    return res.status(200).json({ data: group });
  } catch (error) {
    return next(error);
  }
};

const getUserCircles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getUserCircles",
    req,
  );

  try {
    actionLogger.info("Fetching user's study circles");
    const { user } = req as AuthenticatedRequest;

    const groups = await CircleService.getUserCircles(user.id);

    actionLogger.info(
      {
        userId: user.id,
        groupCount: groups.length,
      },
      "User study circles retrieved successfully",
    );

    return res.status(200).json({
      data: groups,
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const getRecentActivityCircles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getRecentActivityCircles",
    req,
  );
  try {
    actionLogger.info("Fetching recent activity study circles");

    const { user, query } = req as AuthenticatedRequest;

    const limit = query.limit ? Number(query.limit) : 8;

    const groups = await CircleService.getRecentActivityCircles(user.id, limit);
    actionLogger.info(
      {
        userId: user.id,
        groupCount: groups.length,
      },
      "Recent activity study circles retrieved successfully",
    );
    return res.status(200).json({
      data: groups,
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const updateCircle = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "updateCircle",
    req,
  );

  try {
    actionLogger.info("Updating study circle");
    const { user } = req as AuthenticatedRequest;
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const data = UpdateStudyCircleDataSchema.parse(req.body);

    const updatedGroup = await CircleService.updateCircle(circleId, user, data);

    actionLogger.info(
      {
        circleId,
        groupName: updatedGroup.name,
        userId: user.id,
      },
      "Study circle updated successfully",
    );

    return res.status(200).json({
      data: updatedGroup,
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const deleteCircle = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "deleteCircle",
    req,
  );

  try {
    actionLogger.info("Deleting Study circle");
    const { user } = req as AuthenticatedRequest;
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    await CircleService.deleteCircle(circleId, user);

    actionLogger.info(
      {
        circleId,
        userId: user.id,
      },
      "Study circle deleted successfully",
    );

    return res.status(200).json({
      message: "Study circle deleted successfully",
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const getCircleAvatars = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getCircleAvatars",
    req,
  );

  try {
    actionLogger.info("Fetching study circle avatars");
    const { user } = req as AuthenticatedRequest;

    const customSchema = createPaginationSchema(20, 60, "number");
    const { limit, cursor } = customSchema.parse(req.query);

    const result = await CircleService.getCircleAvatars(
      limit,
      cursor as number | undefined,
    );

    actionLogger.info(
      {
        userId: user.id,
        avatarCount: result.data.length,
      },
      "Study circle avatars retrieved successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

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
