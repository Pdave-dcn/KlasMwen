import { createLogger } from "../../core/config/logger.js";
import CircleService from "../../features/circle/service/CircleService.js";
import createActionLogger from "../../utils/logger.util.js";
import { createPaginationSchema } from "../../utils/pagination.util.js";
import {
  AddMemberDataSchema,
  MuteMemberDataSchema,
  SearchCircleMembersQuerySchema,
  StudyCircleIdParamSchema,
  UpdateMemberRoleDataSchema,
  UserIdParamSchema,
} from "../../zodSchemas/circle.zod.js";

import type {
  AuthenticatedEnrichedRequest,
  AuthenticatedRequest,
} from "../../types/AuthRequest.js";
import type { NextFunction, Request, Response } from "express";

const controllerLogger = createLogger({ module: "CircleMemberController" });

const addMember = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "addMember", req);

  try {
    actionLogger.info("Adding member to study circle");
    const { user } = req as AuthenticatedRequest;
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const { userId, role } = AddMemberDataSchema.parse(req.body);

    const member = await CircleService.addMember(
      {
        userId,
        circleId,
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

const getCircleMembers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getCircleMembers",
    req,
  );

  try {
    actionLogger.info("Fetching study circle members");

    const { user } = req as AuthenticatedRequest;
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    const customParser = createPaginationSchema(10, 30, "uuid");
    const { limit, cursor } = customParser.parse(req.query);

    const result = await CircleService.getCircleMembers(user.id, circleId, {
      limit,
      cursor: cursor as string,
    });

    actionLogger.info(
      {
        circleId,
        pageSize: limit,
      },
      "Circle members retrieved successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};
const getMutedMembers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getMutedMembers",
    req,
  );

  try {
    actionLogger.info("Fetching muted circle members");

    const { user } = req as AuthenticatedEnrichedRequest;
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    const customParser = createPaginationSchema(10, 30, "uuid");
    const { limit, cursor } = customParser.parse(req.query);

    const result = await CircleService.getMutedMembers(user, circleId, {
      limit,
      cursor: cursor as string,
    });

    actionLogger.info(
      {
        circleRole: user.circleRole,
        circleId,
        pageSize: limit,
      },
      "Muted circle members retrieved successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const searchCircleMembers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "searchCircleMembers",
    req,
  );

  try {
    actionLogger.info("Searching circle members");
    const { user } = req as AuthenticatedRequest;

    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const { q } = SearchCircleMembersQuerySchema.parse(req.query);

    const result = await CircleService.searchCircleMembers(
      user.id,
      circleId,
      q,
    );

    actionLogger.info(
      { circleId, query: q, resultCount: result.length },
      "Circle member search completed",
    );

    return res.status(200).json({
      data: result,
    });
  } catch (error: unknown) {
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
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const { userId } = UserIdParamSchema.parse(req.params);

    await CircleService.removeMember(userId, circleId, user);

    const isSelfRemoval = user.id === userId;

    actionLogger.info(
      {
        circleId,
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
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const { userId } = UserIdParamSchema.parse(req.params);
    const { role } = UpdateMemberRoleDataSchema.parse(req.body);

    const updatedMember = await CircleService.updateMemberRole(
      userId,
      circleId,
      { role },
      user,
    );

    actionLogger.info(
      {
        circleId,
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

    await CircleService.updateLastReadAt(user.id, chatGroupId);

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

const setMemberMute = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "setMemberMute",
    req,
  );

  try {
    const { user } = req as AuthenticatedRequest;
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const { userId } = UserIdParamSchema.parse(req.params);
    const parsed = MuteMemberDataSchema.parse(req.body);

    actionLogger.info(
      { circleId, targetUserId: userId, muted: parsed.muted },
      parsed.muted ? "Muting circle member" : "Unmuting circle member",
    );

    const updatedMember = parsed.muted
      ? await CircleService.muteMember(user, circleId, userId, parsed.duration)
      : await CircleService.unmuteMember(user, circleId, userId);

    actionLogger.info(
      {
        circleId,
        targetUserId: userId,
        requesterId: user.id,
        isMuted: updatedMember.isMuted,
      },
      parsed.muted
        ? "Member muted successfully"
        : "Member unmuted successfully",
    );

    return res.status(200).json({
      data: updatedMember,
    });
  } catch (error: unknown) {
    return next(error);
  }
};

export {
  addMember,
  getCircleMembers,
  getMutedMembers,
  removeMember,
  updateMemberRole,
  setMemberMute,
  updateLastReadAt,
  searchCircleMembers,
};
