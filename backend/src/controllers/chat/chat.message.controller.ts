import { createLogger } from "../../core/config/logger.js";
import ChatService from "../../features/chat/service/ChatService.js";
import createActionLogger from "../../utils/logger.util.js";
import { createPaginationSchema } from "../../utils/pagination.util.js";
import {
  ChatGroupIdParamSchema,
  MessageIdParamSchema,
  SendMessageDataSchema,
} from "../../zodSchemas/chat.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";
import type { NextFunction, Request, Response } from "express";

const controllerLogger = createLogger({ module: "ChatMessageController" });

const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "sendMessage", req);

  try {
    actionLogger.info("Sending message to chat group");
    const { user } = req as AuthenticatedRequest;
    const { chatGroupId } = ChatGroupIdParamSchema.parse(req.params);
    const { content } = SendMessageDataSchema.parse(req.body);

    const message = await ChatService.sendMessage(
      {
        content,
        senderId: user.id,
        chatGroupId,
      },
      user,
    );

    const io = req.app.get("io");
    io.to(`chat:${chatGroupId}`).emit("chat:new_message", { message });

    actionLogger.info(
      {
        messageId: message.id,
        groupId: chatGroupId,
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
    actionLogger.info("Fetching messages from chat group");
    const { user } = req as AuthenticatedRequest;
    const { chatGroupId } = ChatGroupIdParamSchema.parse(req.params);
    const customValidator = createPaginationSchema(10, 50, "number");
    const { limit, cursor } = customValidator.parse(req.query);

    const result = await ChatService.getMessages(chatGroupId, user, {
      limit,
      cursor: cursor as number | undefined,
    });

    actionLogger.info(
      {
        groupId: chatGroupId,
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

    await ChatService.deleteMessage(messageId, user);

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
