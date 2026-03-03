import type { Socket } from "socket.io";

/**
 * Stops tracking activity counts for a list of study circles.
 *
 * This function:
 * 1. Takes the user's connection out of the "waiting list" (watch room) for specific study circles.
 * 2. Stops the server from sending pulse updates to this user for these study circles.
 */
export const handleDiscoveryUnwatch = (socket: Socket) => {
  return async (data: { circleIds: string[] }) => {
    if (!Array.isArray(data?.circleIds) || data.circleIds.length === 0) return;
    for (const circleId of data.circleIds) {
      await socket.leave(`watch:${circleId}`);
    }
  };
};
