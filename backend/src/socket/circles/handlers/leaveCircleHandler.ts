import { createLogger } from "../../../core/config/logger.js";
import { StudyCircleIdParamSchema } from "../../../zodSchemas/circle.zod.js";
import { broadcastPresenceUpdate } from "../helpers/broadcastPresenceUpdate.js";

import type UserService from "../../../features/user/service/UserService.js";
import type { Namespace, Socket } from "socket.io";

const logger = createLogger({ module: "StudyCircleSocket" });

/**
 * Handles a student manually exiting a study circle.
 *
 * This function:
 * 1. Disconnects the student from the live chat room so they stop receiving messages.
 * 2. Removes the study circle from the student's "active sessions" list.
 * 3. Tells everyone on the Dashboard/Hub that there is one less person active in this study circle.
 * 4. Notifies other students still in the room that this person has left.
 * @param socket - The student's individual connection.
 * @param nsp - The overall study circle server area.
 */
export const handleLeaveCircle = (socket: Socket, nsp: Namespace) => {
  return async (
    data: { circleId: string },
    callback?: (response: { success: boolean }) => void,
  ) => {
    try {
      const { circleId } = StudyCircleIdParamSchema.parse(data);

      const user = socket.data.user as Awaited<
        ReturnType<typeof UserService.getUserForSocket>
      >;

      logger.info(
        { userId: user.id, circleId },
        "User leaving study circle room",
      );

      await socket.leave(`circle:${circleId}`);
      (socket.data.joinedStudyCircles as Set<string>)?.delete(circleId);

      void broadcastPresenceUpdate(circleId, nsp);

      socket.to(`circle:${circleId}`).emit("circle:member_left", {
        user: {
          id: user.id,
          username: user.username,
        },
      });

      callback?.({ success: true });
    } catch (error) {
      logger.error(
        { userId: socket.data.user.id, error },
        "Error leaving study circle room",
      );

      callback?.({ success: false });
    }
  };
};
