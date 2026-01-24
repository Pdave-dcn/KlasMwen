/* eslint-disable no-console */
import { useEffect } from "react";

import { useChatStore } from "@/stores/chat.store";
import {
  SocketMemberJoinedDataSchema,
  SocketMemberLeftDataSchema,
} from "@/zodSchemas/chat.zod";

import { chatSocketService } from "../services/socketService";

export const useChatPresence = (groupId: string | null) => {
  useEffect(() => {
    if (!groupId) return;

    const unsubJoined = chatSocketService.onMemberJoined((payload) => {
      const parsed = SocketMemberJoinedDataSchema.safeParse(payload);
      if (!parsed.success) {
        console.error("Invalid member joined payload", parsed.error);
        return;
      }

      useChatStore.getState().setMemberJoined(parsed.data.user.id);
    });

    const unsubLeft = chatSocketService.onMemberLeft((payload) => {
      const parsed = SocketMemberLeftDataSchema.safeParse(payload);
      if (!parsed.success) {
        console.error("Invalid member left payload", parsed.error);
        return;
      }

      useChatStore.getState().setMemberLeft(parsed.data.user.id);
    });

    return () => {
      unsubJoined();
      unsubLeft();
      useChatStore.getState().clearPresence();
      useChatStore.getState().clearOnlineMembers();
    };
  }, [groupId]);
};
