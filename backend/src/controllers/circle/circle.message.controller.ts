import { createLogger } from "../../core/config/logger.js";
import { circleService } from "../../features/circle/service/CircleService.js";
import { withLogging } from "../../utils/logger.util.js";
import { createPaginationSchema } from "../../utils/pagination.util.js";
import {
  StudyCircleIdParamSchema,
  MessageIdParamSchema,
  SendMessageDataSchema,
} from "../../zodSchemas/circle.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";

const controllerLogger = createLogger({ module: "CircleMessageController" });

const sendMessage = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "sendMessage",
  async ({ req, res, log }) => {
    log.info("Sending message to study circle");

    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const { content } = SendMessageDataSchema.parse(req.body);

    const message = await circleService.messages.sendMessage(
      {
        content,
        senderId: req.user.id,
        circleId,
      },
      req.user,
    );

    const io = req.app.get("io");

    if (io) {
      const chatNamespace = io.of("/circles");

      chatNamespace
        .to(`circle:${circleId}`)
        .emit("circle:new_message", message);
    }

    log.info(
      {
        messageId: message.id,
        circleId,
        senderId: req.user.id,
      },
      "Message sent successfully",
    );

    res.status(201).json({
      data: message,
    });
  },
);

const getMessages = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getMessages",
  async ({ req, res, log }) => {
    log.info("Fetching messages from study circle");
    const { circleId } = StudyCircleIdParamSchema.parse(req.params);
    const customValidator = createPaginationSchema(10, 50, "number");
    const { limit, cursor } = customValidator.parse(req.query);

    const result = await circleService.messages.getMessages(circleId, req.user, {
      limit,
      cursor: cursor as number | undefined,
    });

    log.info(
      {
        circleId,
        messageCount: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "Messages retrieved successfully",
    );

    res.status(200).json(result);
  },
);

const deleteMessage = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "deleteMessage",
  async ({ req, res, log }) => {
    log.info("Deleting message");
    const { id: messageId } = MessageIdParamSchema.parse(req.params);

    await circleService.messages.deleteMessage(messageId, req.user);

    log.info(
      {
        messageId,
        userId: req.user.id,
      },
      "Message deleted successfully",
    );

    res.status(200).json({
      message: "Message deleted successfully",
    });
  },
);

export { sendMessage, getMessages, deleteMessage };
