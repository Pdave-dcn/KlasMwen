import { createLogger } from "../../core/config/logger.js";
import CircleService from "../../features/circle/service/CircleService.js";
import createActionLogger from "../../utils/logger.util.js";
import { createPaginationSchema } from "../../utils/pagination.util.js";
import {
  StudyCircleIdParamSchema,
  MessageIdParamSchema,
  SendMessageDataSchema,
} from "../../zodSchemas/circle.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";
import type { NextFunction, Request, Response } from "express";

const controllerLogger = createLogger({ module: "CircleMessageController" });

const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "sendMessage", req);

  try {
    actionLogger.info("Sending message to study circle");

    const { user } = req as AuthenticatedRequest;
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const { content } = SendMessageDataSchema.parse(req.body);

    const message = await CircleService.sendMessage(
      {
        content,
        senderId: user.id,
        circleId,
      },
      user,
    );

    const io = req.app.get("io");

    if (io) {
      const chatNamespace = io.of("/circles");

      chatNamespace
        .to(`circle:${circleId}`)
        .emit("circle:new_message", message);
    }

    actionLogger.info(
      {
        messageId: message.id,
        circleId,
        senderId: user.id,
      },
      "Message sent successfully",
    );

    return res.status(201).json({
      data: message,
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "getMessages", req);

  try {
    actionLogger.info("Fetching messages from study circle");
    const { user } = req as AuthenticatedRequest;
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const customValidator = createPaginationSchema(10, 50, "number");
    const { limit, cursor } = customValidator.parse(req.query);

    const result = await CircleService.getMessages(circleId, user, {
      limit,
      cursor: cursor as number | undefined,
    });

    actionLogger.info(
      {
        circleId,
        messageCount: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "Messages retrieved successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "deleteMessage",
    req,
  );

  try {
    actionLogger.info("Deleting message");
    const { user } = req as AuthenticatedRequest;
    const { id: messageId } = MessageIdParamSchema.parse(req.params);

    await CircleService.deleteMessage(messageId, user);

    actionLogger.info(
      {
        messageId,
        userId: user.id,
      },
      "Message deleted successfully",
    );

    return res.status(200).json({
      message: "Message deleted successfully",
    });
  } catch (error: unknown) {
    return next(error);
  }
};

export { sendMessage, getMessages, deleteMessage };
