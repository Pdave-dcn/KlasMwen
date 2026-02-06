import type { Namespace, Socket } from "socket.io";

/**
 * Lets a user "follow" the activity levels of several groups at once.
 *
 * This function:
 * 1. Puts the user's connection into a "waiting list" (watch room) for each group ID.
 * 2. Checks how many people are currently chatting in those groups right now.
 * 3. Immediately sends those numbers back so the UI cards can show the correct counts.
 * @param socket - The current user's connection.
 * @param nsp - The server area where all chat communication happens.
 */
export const handleDiscoveryWatch = (socket: Socket, nsp: Namespace) => {
  return async (data: { chatGroupIds: string[] }) => {
    for (const chatGroupId of data.chatGroupIds) {
      // Join a passive room dedicated to receiving presence pulses
      await socket.join(`watch:${chatGroupId}`);
    }

    const counts: Record<string, number> = {};
    for (const chatGroupId of data.chatGroupIds) {
      // Calculate active participants in the actual chat room
      const socketsInRoom = await nsp.in(`chat:${chatGroupId}`).fetchSockets();

      // Note: Using unique user IDs here is recommended to avoid double-counting tabs
      const uniqueCount = new Set(socketsInRoom.map((s) => s.data.user.id))
        .size;
      counts[chatGroupId] = uniqueCount;
    }

    // Send the starting numbers back to the user
    socket.emit("chat:presence_counts_update", { counts });
  };
};
