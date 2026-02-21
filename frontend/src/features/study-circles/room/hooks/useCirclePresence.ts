/* eslint-disable no-console */
import { useEffect } from "react";

import { useCircleStore } from "@/stores/circle.store";
import {
  SocketMemberJoinedDataSchema,
  SocketMemberLeftDataSchema,
} from "@/zodSchemas/chat.zod";

import { circleSocketService } from "../../services/socketService";

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
