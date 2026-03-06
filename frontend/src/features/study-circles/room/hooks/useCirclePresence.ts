/* eslint-disable no-console */
import { useEffect } from "react";

import { useCircleStore } from "@/stores/circle.store";
import {
  SocketMemberJoinedDataSchema,
  SocketMemberLeftDataSchema,
} from "@/zodSchemas/circle.zod";

import { circleSocketService } from "../../services/socketService";

/**
 * Listens for real-time member presence updates in a study circle.
 *
 * This hook:
 * - Subscribes to socket events when members join or leave a circle
 * - Updates the presence state in the circle store
 * - Clears presence data when the circle changes or the component unmounts
 *
 * @param {string | null} groupId - ID of the active circle. If `null`,
 * presence listeners are not registered.
 */
export const useCirclePresence = (groupId: string | null) => {
  useEffect(() => {
    if (!groupId) return;

    const unsubJoined = circleSocketService.onMemberJoined((payload) => {
      const parsed = SocketMemberJoinedDataSchema.safeParse(payload);
      if (!parsed.success) {
        console.error("Invalid member joined payload", parsed.error);
        return;
      }

      useCircleStore.getState().setMemberJoined(parsed.data.user.id);
    });

    const unsubLeft = circleSocketService.onMemberLeft((payload) => {
      const parsed = SocketMemberLeftDataSchema.safeParse(payload);
      if (!parsed.success) {
        console.error("Invalid member left payload", parsed.error);
        return;
      }

      useCircleStore.getState().setMemberLeft(parsed.data.user.id);
    });

    return () => {
      unsubJoined();
      unsubLeft();
      useCircleStore.getState().clearPresence();
      useCircleStore.getState().clearOnlineMembers();
    };
  }, [groupId]);
};
