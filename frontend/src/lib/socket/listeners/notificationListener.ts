/* eslint-disable no-console */
import { useNotificationStore } from "@/stores/notification.store";
import { showNotificationToast } from "@/utils/notificationToast.util";
import { SocketNotificationSchema } from "@/zodSchemas/notification.zod";

import type { Socket } from "socket.io-client";

export const listenToNotifications = (socket: Socket) => {
  socket.on("notification:new", (payload: unknown) => {
    const parsed = SocketNotificationSchema.safeParse(payload);

    if (!parsed.success) {
      console.error("Invalid socket notification payload", parsed.error);
      return;
    }

    useNotificationStore.getState().incrementUnread();
    showNotificationToast(parsed.data.type);
  });
};
