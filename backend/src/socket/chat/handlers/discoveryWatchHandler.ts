import type { Namespace, Socket } from "socket.io";

/**
 * Lets a user "follow" the activity levels of several study circles at once.
 *
 * This function:
 * 1. Puts the user's connection into a "waiting list" (watch room) for each group ID.
 * 2. Checks how many people are currently chatting in those study circles right now.
 * 3. Immediately sends those numbers back so the UI cards can show the correct counts.
 * @param socket - The current user's connection.
 * @param nsp - The server area where all chat communication happens.
 */
export const handleDiscoveryWatch = (socket: Socket, nsp: Namespace) => {
  return async (data: { circleIds: string[] }) => {
    if (!Array.isArray(data?.circleIds)) return;
    for (const circleId of data.circleIds) {
      // Join a passive room dedicated to receiving presence pulses
      await socket.join(`watch:${circleId}`);
    }

    const counts: Record<string, number> = {};
    for (const circleId of data.circleIds) {
      // Calculate active participants in the actual chat room
      const socketsInRoom = await nsp.in(`chat:${circleId}`).fetchSockets();

      // Note: Using unique user IDs here is recommended to avoid double-counting tabs
      const uniqueCount = new Set(socketsInRoom.map((s) => s.data.user.id))
        .size;
      counts[circleId] = uniqueCount;
    }

    // Send the starting numbers back to the user
    socket.emit("chat:presence_counts_update", { counts });
  };
};
