import { usePresenceStore } from "@/stores/presence.store";

import type { Socket } from "socket.io-client";

export const listenToPresence = (socket: Socket) => {
  const { setOnline, setOffline } = usePresenceStore.getState();

  socket.on("presence:user_online", ({ userId }) => {
    setOnline(userId);
  });

  socket.on("presence:user_offline", ({ userId }) => {
    setOffline(userId);
  });
};
