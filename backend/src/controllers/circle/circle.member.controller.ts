import { createLogger } from "../../core/config/logger.js";
import { circleService } from "../../features/circle/service/CircleService.js";
import { withLogging } from "../../utils/logger.util.js";
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

const controllerLogger = createLogger({ module: "CircleMemberController" });

const addMember = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "addMember",
  async ({ req, res, log }) => {
    log.info("Adding member to study circle");
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const { userId, role } = AddMemberDataSchema.parse(req.body);

    const member = await circleService.members.addMember(
      {
        userId,
        circleId,
        role,
      },
      req.user,
    );

    log.info(
      {
        circleId,
        addedUserId: userId,
        role: member.role,
        requesterId: req.user.id,
      },
      "Member added successfully",
    );

    res.status(201).json({
      data: member,
    });
  },
);

const getCircleMembers = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getCircleMembers",
  async ({ req, res, log }) => {
    log.info("Fetching study circle members");

    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    const customParser = createPaginationSchema(10, 30, "uuid");
    const { limit, cursor } = customParser.parse(req.query);

    const result = await circleService.members.getCircleMembers(req.user.id, circleId, {
      limit,
      cursor: cursor as string,
    });

    log.info(
      {
        circleId,
        pageSize: limit,
      },
      "Circle members retrieved successfully",
    );

    res.status(200).json(result);
  },
);

const getMutedMembers = withLogging<AuthenticatedEnrichedRequest>(
  controllerLogger,
  "getMutedMembers",
  async ({ req, res, log }) => {
    log.info("Fetching muted circle members");

    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    const customParser = createPaginationSchema(10, 30, "uuid");
    const { limit, cursor } = customParser.parse(req.query);

    const result = await circleService.members.getMutedMembers(req.user, circleId, {
      limit,
      cursor: cursor as string,
    });

    log.info(
      {
        circleRole: req.user.circleRole,
        circleId,
        pageSize: limit,
      },
      "Muted circle members retrieved successfully",
    );

    res.status(200).json(result);
  },
);

const searchCircleMembers = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "searchCircleMembers",
  async ({ req, res, log }) => {
    log.info("Searching circle members");

    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const { q } = SearchCircleMembersQuerySchema.parse(req.query);

    const result = await circleService.members.searchCircleMembers(
      req.user.id,
      circleId,
      q,
    );

    log.info(
      { circleId, query: q, resultCount: result.length },
      "Circle member search completed",
    );

    res.status(200).json({
      data: result,
    });
  },
);

const removeMember = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "removeMember",
  async ({ req, res, log }) => {
    log.info("Removing member from study circle");
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const { userId } = UserIdParamSchema.parse(req.params);

    await circleService.members.removeMember(userId, circleId, req.user);

    const isSelfRemoval = req.user.id === userId;

    log.info(
      {
        circleId,
        removedUserId: userId,
        requesterId: req.user.id,
        isSelfRemoval,
      },
      isSelfRemoval
        ? "User left circle successfully"
        : "Member removed successfully",
    );

    res.status(200).json({
      message: isSelfRemoval
        ? "Left circle successfully"
        : "Member removed successfully",
    });
  },
);

const updateMemberRole = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "updateMemberRole",
  async ({ req, res, log }) => {
    log.info("Updating member role");
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const { userId } = UserIdParamSchema.parse(req.params);
    const { role } = UpdateMemberRoleDataSchema.parse(req.body);

    const updatedMember = await circleService.members.updateMemberRole(
      userId,
      circleId,
      { role },
      req.user,
    );

    log.info(
      {
        circleId,
        targetUserId: userId,
        newRole: role,
        requesterId: req.user.id,
      },
      "Member role updated successfully",
    );

    res.status(200).json({
      data: updatedMember,
    });
  },
);

const updateLastReadAt = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "updateLastReadAt",
  async ({ req, res, log }) => {
    log.info("Updating last read timestamp");
    const { circleId: chatGroupId } = StudyCircleIdParamSchema.parse(
      req.params,
    );

    await circleService.members.updateLastReadAt(req.user.id, chatGroupId);

    log.info(
      {
        groupId: chatGroupId,
        targetUserId: req.user.id,
        requesterId: req.user.id,
      },
      "Last read timestamp updated successfully",
    );

    res.status(200).json({
      message: "Last read timestamp updated successfully",
    });
  },
);

const setMemberMute = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "setMemberMute",
  async ({ req, res, log }) => {
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const { userId } = UserIdParamSchema.parse(req.params);
    const parsed = MuteMemberDataSchema.parse(req.body);

    log.info(
      { circleId, targetUserId: userId, muted: parsed.muted },
      parsed.muted ? "Muting circle member" : "Unmuting circle member",
    );

    const updatedMember = parsed.muted
      ? await circleService.members.muteMember(req.user, circleId, userId, parsed.duration)
      : await circleService.members.unmuteMember(req.user, circleId, userId);

    log.info(
      {
        circleId,
        targetUserId: userId,
        requesterId: req.user.id,
        isMuted: updatedMember.isMuted,
      },
      parsed.muted
        ? "Member muted successfully"
        : "Member unmuted successfully",
    );

    res.status(200).json({
      data: updatedMember,
    });
  },
);

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
