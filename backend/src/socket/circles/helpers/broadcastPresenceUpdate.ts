import type { Namespace } from "socket.io";

/**
 * Updates the 'Active Student' count for a specific study circle.
 * This function:
 * 1. Finds everyone currently inside a specific study circle room.
 * 2. Counts how many unique students are there (ignoring multiple tabs).
 * 3. Sends that number to anyone currently looking at the Dashboard/Discovery cards
 * so their "Active Students" count updates in real-time.
 *
 * @param circleId - The ID of the study circle that just had someone join or leave.
 * @param nsp - The socket server instance used to send the update.
 */
export const broadcastPresenceUpdate = async (
  circleId: string,
  nsp: Namespace,
) => {
  const socketsInCircle = await nsp.in(`circle:${circleId}`).fetchSockets();

  // Get unique user count
  const uniqueCount = new Set(socketsInCircle.map((s) => s.data.user.id)).size;

  // Emit only to the "watchers" room
  nsp.to(`watch:${circleId}`).emit("circle:presence_counts_update", {
    counts: { [circleId]: uniqueCount },
  });
};
