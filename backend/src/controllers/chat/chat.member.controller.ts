import { createLogger } from "../../core/config/logger.js";
import ChatService from "../../features/chat/service/ChatService.js";
import createActionLogger from "../../utils/logger.util.js";
import {
  AddMemberDataSchema,
  ChatGroupIdParamSchema,
  UpdateMemberRoleDataSchema,
  UserIdParamSchema,
} from "../../zodSchemas/chat.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";
import type { NextFunction, Request, Response } from "express";

const controllerLogger = createLogger({ module: "ChatMemberController" });

const addMember = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "addMember", req);

  try {
    actionLogger.info("Adding member to chat group");
    const { user } = req as AuthenticatedRequest;
    const { chatGroupId } = ChatGroupIdParamSchema.parse(req.params);
    const { userId, role } = AddMemberDataSchema.parse(req.body);

    const member = await ChatService.addMember(
      {
        userId,
        chatGroupId,
        role,
      },
      user
    );

    actionLogger.info(
      {
        groupId: chatGroupId,
        addedUserId: userId,
        role: member.role,
        requesterId: user.id,
      },
      "Member added successfully"
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
  next: NextFunction
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getGroupMembers",
    req
  );

  try {
    actionLogger.info("Fetching group members");
    const { chatGroupId } = ChatGroupIdParamSchema.parse(req.params);

    const members = await ChatService.getGroupMembers(chatGroupId);

    actionLogger.info(
      {
        groupId: chatGroupId,
        memberCount: members.length,
      },
      "Group members retrieved successfully"
    );

    return res.status(200).json({
      data: members,
    });
  } catch (error: unknown) {
    actionLogger.error({ error }, "Failed to fetch group members");
    return next(error);
  }
};

const removeMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "removeMember",
    req
  );

  try {
    actionLogger.info("Removing member from chat group");
    const { user } = req as AuthenticatedRequest;
    const { chatGroupId } = ChatGroupIdParamSchema.parse(req.params);
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
        ? "User left group successfully"
        : "Member removed successfully"
    );

    return res.status(200).json({
      message: isSelfRemoval
        ? "Left group successfully"
        : "Member removed successfully",
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const updateMemberRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "updateMemberRole",
    req
  );

  try {
    actionLogger.info("Updating member role");
    const { user } = req as AuthenticatedRequest;
    const { chatGroupId } = ChatGroupIdParamSchema.parse(req.params);
    const { userId } = UserIdParamSchema.parse(req.params);
    const { role } = UpdateMemberRoleDataSchema.parse(req.body);

    const updatedMember = await ChatService.updateMemberRole(
      userId,
      chatGroupId,
      { role },
      user
    );

    actionLogger.info(
      {
        groupId: chatGroupId,
        targetUserId: userId,
        newRole: role,
        requesterId: user.id,
      },
      "Member role updated successfully"
    );

    return res.status(200).json({
      data: updatedMember,
    });
  } catch (error: unknown) {
    return next(error);
  }
};

export { addMember, getGroupMembers, removeMember, updateMemberRole };
