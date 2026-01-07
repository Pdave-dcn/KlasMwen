import { useNotificationStore } from "@/stores/notification.store";
import { SocketNotificationSchema } from "@/zodSchemas/notification.zod";

import type { Socket } from "socket.io-client";

export const registerNotificationListeners = (socket: Socket) => {
  socket.on("notification:new", (payload: unknown) => {
    const parsed = SocketNotificationSchema.safeParse(payload);

    if (!parsed.success) {
      console.error("Invalid socket notification payload", parsed.error);
      return;
    }

    useNotificationStore.getState().incrementUnread();
  });
};
