import { createLogger } from "../../core/config/logger.js";
import ChatService from "../../features/chat/service/ChatService.js";
import createActionLogger from "../../utils/logger.util.js";
import {
  StudyCircleIdParamSchema,
  CreateChatGroupDataSchema,
  UpdateChatGroupDataSchema,
} from "../../zodSchemas/chat.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";
import type { NextFunction, Request, Response } from "express";

const controllerLogger = createLogger({ module: "ChatGroupController" });

const createChatGroup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "createChatGroup",
    req,
  );

  try {
    actionLogger.info("Creating study circle");
    const { user } = req as AuthenticatedRequest;

    const parsed = CreateChatGroupDataSchema.parse({
      ...req.body,
      creatorId: user.id,
    });

    const group = await ChatService.createGroup(parsed);

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

const joinGroup = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "joinGroup", req);

  try {
    actionLogger.info("User joining study circle");

    const { user } = req as AuthenticatedRequest;
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    const group = await ChatService.joinGroup(circleId, user.id);

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

const getGroupById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getGroupById",
    req,
  );

  try {
    actionLogger.info("Fetching study circle by ID");
    const { user } = req as AuthenticatedRequest;
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    const group = await ChatService.getGroupById(circleId, user.id);

    actionLogger.info(
      {
        circleId,
        groupName: group.name,
        userRole: group.userRole,
      },
      "Study circle retrieved successfully",
    );

    return res.status(200).json({
      data: group,
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const getGroupPreviewDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getGroupDetails",
    req,
  );
  try {
    actionLogger.info("Fetching study circle details");
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    const group = await ChatService.getGroupPreviewDetails(circleId);
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

const getUserGroups = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getUserGroups",
    req,
  );

  try {
    actionLogger.info("Fetching user's study circles");
    const { user } = req as AuthenticatedRequest;

    const groups = await ChatService.getUserGroups(user.id);

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

const getRecentActivityGroups = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getRecentActivityGroups",
    req,
  );
  try {
    actionLogger.info("Fetching recent activity study circles");

    const { user, query } = req as AuthenticatedRequest;

    const limit = query.limit ? Number(query.limit) : 8;

    const groups = await ChatService.getRecentActivityGroups(user.id, limit);
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

const updateGroup = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "updateGroup", req);

  try {
    actionLogger.info("Updating study circle");
    const { user } = req as AuthenticatedRequest;
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const data = UpdateChatGroupDataSchema.parse(req.body);

    const updatedGroup = await ChatService.updateGroup(circleId, user, data);

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

const deleteGroup = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "deleteGroup", req);

  try {
    actionLogger.info("Deleting Study circle");
    const { user } = req as AuthenticatedRequest;
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    await ChatService.deleteGroup(circleId, user);

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

export {
  createChatGroup,
  getGroupById,
  getUserGroups,
  updateGroup,
  deleteGroup,
  joinGroup,
  getRecentActivityGroups,
  getGroupPreviewDetails,
};
