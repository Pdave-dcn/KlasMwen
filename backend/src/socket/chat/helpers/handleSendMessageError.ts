import { AuthorizationError } from "../../../core/error/custom/auth.error.js";
import {
  ChatGroupNotFoundError,
  NotAMemberError,
} from "../../../core/error/custom/chat.error.js";

import type ChatService from "../../../features/chat/service/ChatService.js";
import type { Logger } from "pino";
import type { Socket } from "socket.io";

export type SendMessageCallback = (response: {
  success: boolean;
  message?: Awaited<ReturnType<typeof ChatService.sendMessage>>;
  error?: string;
}) => void;

export const handleSendMessageError = (
  error: unknown,
  socket: Socket,
  chatGroupId: string,
  logger: Logger,
  callback?: SendMessageCallback,
) => {
  logger.error(
    { userId: socket.data.user?.id, chatGroupId, error },
    "Error sending message",
  );

  if (error instanceof ChatGroupNotFoundError) {
    callback?.({ success: false, error: "Chat group not found" });
    return;
  }

  if (error instanceof AuthorizationError) {
    callback?.({ success: false, error: "Not authorized to send messages" });
    return;
  }

  if (error instanceof NotAMemberError) {
    callback?.({ success: false, error: "Not a member of this group" });
    return;
  }

  callback?.({ success: false, error: "Failed to send message" });
};
