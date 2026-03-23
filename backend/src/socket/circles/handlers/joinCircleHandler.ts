import { createLogger } from "../../../core/config/logger.js";
import {
  CircleNotFoundError,
  NotAMemberError,
} from "../../../core/error/custom/circle.error.js";
import CircleService from "../../../features/circle/service/CircleService.js";
import { StudyCircleIdParamSchema } from "../../../zodSchemas/circle.zod.js";
import { PresenceService } from "../../presence/presence.service.js";
import { broadcastPresenceUpdate } from "../helpers/broadcastPresenceUpdate.js";

import type UserService from "../../../features/user/service/UserService.js";
import type { Namespace, Socket } from "socket.io";

const logger = createLogger({ module: "StudyCircleSocket" });

// Helper function to get present and online members
const getMemberPresence = async (
  nsp: Namespace,
  studyCircleId: string,
): Promise<{ presentMemberIds: string[]; onlineMemberIds: string[] }> => {
  const socketsInRoom = await nsp.in(`circle:${studyCircleId}`).fetchSockets();

  const presentMemberIds = Array.from(
    new Set(socketsInRoom.map((s) => s.data.user.id)),
  );

  const allMemberIds = await CircleService.getCircleMemberIds(studyCircleId);

  const onlineMemberIds = allMemberIds.filter((userId) =>
    PresenceService.isOnline(userId),
  );

  return { presentMemberIds, onlineMemberIds };
};

// Helper function to handle errors
const handleJoinCircleError = (
  error: unknown,
  callback?: (response: { success: boolean; error?: string }) => void,
) => {
  if (error instanceof CircleNotFoundError) {
    callback?.({ success: false, error: "Study circle not found" });
  } else if (error instanceof NotAMemberError) {
    callback?.({ success: false, error: "Not a member of this study circle" });
  } else {
    callback?.({ success: false, error: "Failed to join study circle" });
  }
};

/**
 * Handles a student entering a specific study circle room.
 *
 * This function:
 * 1. Checks if the study circle exists and if the student is actually allowed to be there.
 * 2. Connects the student to the live chat room so they can send and receive messages.
 * 3. Tells everyone on the Dashboard/Hub that one more person is active in this study circle.
 * 4. Gathers two lists: who is currently inside the chat room right now (Present)
 * and who is just online on the app (Online).
 * 5. Sends a "Welcome" notification to the other students already in the room.
 * @param socket - The student's individual connection.
 * @param nsp - The overall chat server area.
 */
export const handleJoinCircle = (socket: Socket, nsp: Namespace) => {
  return async (
    data: { circleId: string },
    callback?: (response: {
      success: boolean;
      presentMemberIds?: string[]; // People actually WATCHING the chat
      onlineMemberIds?: string[]; // People who have the APP OPEN
      error?: string;
    }) => void,
  ) => {
    try {
      const { circleId } = StudyCircleIdParamSchema.parse(data);

      const user = socket.data.user as Awaited<
        ReturnType<typeof UserService.getUserForSocket>
      >;

      logger.info(
        { userId: user.id, circleId, socketId: socket.id },
        "User joining study circle room",
      );

      // Validate study circle exists and user is a member
      await CircleService.verifyCircleExists(circleId);
      const isMember = await CircleService.isMember(user.id, circleId);

      if (!isMember) {
        throw new NotAMemberError(user.id, circleId);
      }

      // Join the room
      await socket.join(`circle:${circleId}`);
      socket.data.joinedStudyCircles ??= new Set<string>();
      (socket.data.joinedStudyCircles as Set<string>).add(circleId);

      void broadcastPresenceUpdate(circleId, nsp);

      const { presentMemberIds, onlineMemberIds } = await getMemberPresence(
        nsp,
        circleId,
      );

      callback?.({ success: true, presentMemberIds, onlineMemberIds });

      socket.to(`circle:${circleId}`).emit("circle:member_joined", {
        user: { id: user.id, username: user.username },
      });

      logger.info(
        { userId: user.id, circleId },
        "User joined study circle room",
      );
    } catch (error) {
      logger.error(
        { userId: socket.data.user.id, circleId: data.circleId, error },
        "Error joining study circle",
      );
      handleJoinCircleError(error, callback);
    }
  };
};
