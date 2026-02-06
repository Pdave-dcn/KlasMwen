import type { Socket } from "socket.io";

/**
 * Stops tracking activity counts for a list of groups.
 *
 * This function:
 * 1. Takes the user's connection out of the "waiting list" (watch room) for specific groups.
 * 2. Stops the server from sending pulse updates to this user for these groups.
 */
export const handleDiscoveryUnwatch = (socket: Socket) => {
  return async (data: { chatGroupIds: string[] }) => {
    for (const chatGroupId of data.chatGroupIds) {
      await socket.leave(`watch:${chatGroupId}`);
    }
  };
};
