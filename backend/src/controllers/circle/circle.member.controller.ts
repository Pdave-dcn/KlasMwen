import { createLogger } from "../../core/config/logger.js";
import ChatService from "../../features/chat/service/ChatService.js";
import createActionLogger from "../../utils/logger.util.js";
import {
  AddMemberDataSchema,
  StudyCircleIdParamSchema,
  UpdateMemberRoleDataSchema,
  UserIdParamSchema,
} from "../../zodSchemas/circle.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";
import type { NextFunction, Request, Response } from "express";

const controllerLogger = createLogger({ module: "CircleMemberController" });

const addMember = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "addMember", req);

  try {
    actionLogger.info("Adding member to study circle");
    const { user } = req as AuthenticatedRequest;
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const { userId, role } = AddMemberDataSchema.parse(req.body);

    const member = await ChatService.addMember(
      {
        userId,
        chatGroupId: circleId,
        role,
      },
      user,
    );

    actionLogger.info(
      {
        circleId,
        addedUserId: userId,
        role: member.role,
        requesterId: user.id,
      },
      "Member added successfully",
    );

    return res.status(201).json({
      data: member,
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const getGroupMembers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getGroupMembers",
    req,
  );

  try {
    actionLogger.info("Fetching study circle members");
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    const members = await ChatService.getGroupMembers(circleId);

    actionLogger.info(
      {
        circleId,
        memberCount: members.length,
      },
      "Circle members retrieved successfully",
    );

    return res.status(200).json({
      data: members,
    });
  } catch (error: unknown) {
    actionLogger.error({ error }, "Failed to fetch circle members");
    return next(error);
  }
};

const removeMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "removeMember",
    req,
  );

  try {
    actionLogger.info("Removing member from study circle");
    const { user } = req as AuthenticatedRequest;
    const { circleId: chatGroupId } = StudyCircleIdParamSchema.parse(
      req.params,
    );
    const { userId } = UserIdParamSchema.parse(req.params);

    await ChatService.removeMember(userId, chatGroupId, user);

    const isSelfRemoval = user.id === userId;

    actionLogger.info(
      {
        groupId: chatGroupId,
        removedUserId: userId,
        requesterId: user.id,
        isSelfRemoval,
      },
      isSelfRemoval
        ? "User left circle successfully"
        : "Member removed successfully",
    );

    return res.status(200).json({
      message: isSelfRemoval
        ? "Left circle successfully"
        : "Member removed successfully",
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const updateMemberRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "updateMemberRole",
    req,
  );

  try {
    actionLogger.info("Updating member role");
    const { user } = req as AuthenticatedRequest;
    const { circleId: chatGroupId } = StudyCircleIdParamSchema.parse(
      req.params,
    );
    const { userId } = UserIdParamSchema.parse(req.params);
    const { role } = UpdateMemberRoleDataSchema.parse(req.body);

    const updatedMember = await ChatService.updateMemberRole(
      userId,
      chatGroupId,
      { role },
      user,
    );

    actionLogger.info(
      {
        groupId: chatGroupId,
        targetUserId: userId,
        newRole: role,
        requesterId: user.id,
      },
      "Member role updated successfully",
    );

    return res.status(200).json({
      data: updatedMember,
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const updateLastReadAt = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "updateLastReadAt",
    req,
  );

  try {
    actionLogger.info("Updating last read timestamp");
    const { user } = req as AuthenticatedRequest;
    const { circleId: chatGroupId } = StudyCircleIdParamSchema.parse(
      req.params,
    );

    await ChatService.updateLastReadAt(user.id, chatGroupId);

    actionLogger.info(
      {
        groupId: chatGroupId,
        targetUserId: user.id,
        requesterId: user.id,
      },
      "Last read timestamp updated successfully",
    );

    return res.status(200).json({
      message: "Last read timestamp updated successfully",
    });
  } catch (error: unknown) {
    return next(error);
  }
};

export {
  addMember,
  getGroupMembers,
  removeMember,
  updateMemberRole,
  updateLastReadAt,
};
