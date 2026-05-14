import { useCallback, useEffect, useMemo } from "react";

import { useSendCircleMessageMutation } from "@/queries/circle";
import { useAuthStore } from "@/stores/auth.store";
import { useCircleStore } from "@/stores/circle.store";

import { useCircleData } from "./useCircleData";
import { useCirclePresence } from "./useCirclePresence";
import { useCircleSync } from "./useCircleSync";

export const useCircleRoom = () => {
  const {
    selectedCircleId,
    selectCircle,
    setCurrentUser,
    setCurrentUserMemberRole,
  } = useCircleStore();
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    if (currentUser) setCurrentUser(currentUser);
  }, [currentUser, setCurrentUser]);

  useCircleSync(selectedCircleId);

  useCirclePresence(selectedCircleId);

  const { data, loading, pagination } = useCircleData(selectedCircleId);

  useEffect(() => {
    setCurrentUserMemberRole(data.selectedCircle?.userRole ?? null);
  }, [data.selectedCircle?.userRole, setCurrentUserMemberRole]);

  const isMuted = useMemo(() => {
    const me = data.members.find((m) => m.userId === currentUser?.id);
    return me?.isMuted ?? false;
  }, [data.members, currentUser?.id]);

  const sendMessageMutation = useSendCircleMessageMutation(
    selectedCircleId ?? "",
    currentUser,
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedCircleId || !content.trim() || isMuted) return;
      await sendMessageMutation.mutateAsync({ content });
    },
    [selectedCircleId, isMuted, sendMessageMutation],
  );

  return {
    data,
    loading,
    pagination,
    currentUser,
    selectedCircleId,
    isMuted,
    handleSelectCircle: selectCircle,
    handleSendMessage,
  };
};
