import { createLogger } from "../../core/config/logger.js";
import ChatService from "../../features/chat/service/ChatService.js";
import createActionLogger from "../../utils/logger.util.js";
import {
  ChatGroupIdParamSchema,
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
    actionLogger.info("Creating chat group");
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
      "Chat group created successfully",
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
    actionLogger.info("User joining chat group");

    const { user } = req as AuthenticatedRequest;
    const { chatGroupId } = ChatGroupIdParamSchema.parse(req.params);

    const group = await ChatService.joinGroup(chatGroupId, user.id);

    actionLogger.info(
      {
        groupId: chatGroupId,
        groupName: group.name,
        userId: user.id,
        userRole: group.userRole,
      },
      "User joined chat group successfully",
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
    actionLogger.info("Fetching chat group by ID");
    const { user } = req as AuthenticatedRequest;
    const { chatGroupId } = ChatGroupIdParamSchema.parse(req.params);

    const group = await ChatService.getGroupById(chatGroupId, user.id);

    actionLogger.info(
      {
        groupId: chatGroupId,
        groupName: group.name,
        userRole: group.userRole,
      },
      "Chat group retrieved successfully",
    );

    return res.status(200).json({
      data: group,
    });
  } catch (error: unknown) {
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
    actionLogger.info("Fetching user's chat groups");
    const { user } = req as AuthenticatedRequest;

    const groups = await ChatService.getUserGroups(user.id);

    actionLogger.info(
      {
        userId: user.id,
        groupCount: groups.length,
      },
      "User groups retrieved successfully",
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
    actionLogger.info("Updating chat group");
    const { user } = req as AuthenticatedRequest;
    const { chatGroupId } = ChatGroupIdParamSchema.parse(req.params);
    const data = UpdateChatGroupDataSchema.parse(req.body);

    const updatedGroup = await ChatService.updateGroup(chatGroupId, user, data);

    actionLogger.info(
      {
        groupId: chatGroupId,
        groupName: updatedGroup.name,
        userId: user.id,
      },
      "Chat group updated successfully",
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
    actionLogger.info("Deleting chat group");
    const { user } = req as AuthenticatedRequest;
    const { chatGroupId } = ChatGroupIdParamSchema.parse(req.params);

    await ChatService.deleteGroup(chatGroupId, user);

    actionLogger.info(
      {
        groupId: chatGroupId,
        userId: user.id,
      },
      "Chat group deleted successfully",
    );

    return res.status(200).json({
      message: "Chat group deleted successfully",
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
};
