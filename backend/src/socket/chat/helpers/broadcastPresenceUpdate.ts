import type { Namespace } from "socket.io";

/**
 * Updates the 'Active Student' count for a specific group.
 * This function:
 * 1. Finds everyone currently inside a specific chat room.
 * 2. Counts how many unique students are there (ignoring multiple tabs).
 * 3. Sends that number to anyone currently looking at the Dashboard/Discovery cards
 * so their "Active Students" count updates in real-time.
 *
 * @param chatGroupId - The ID of the group that just had someone join or leave.
 * @param nsp - The socket server instance used to send the update.
 */
export const broadcastPresenceUpdate = async (
  chatGroupId: string,
  nsp: Namespace,
) => {
  const socketsInChat = await nsp.in(`chat:${chatGroupId}`).fetchSockets();

  // Get unique user count
  const uniqueCount = new Set(socketsInChat.map((s) => s.data.user.id)).size;

  // Emit only to the "watchers" room
  nsp.to(`watch:${chatGroupId}`).emit("chat:presence_counts_update", {
    counts: { [chatGroupId]: uniqueCount },
  });
};
