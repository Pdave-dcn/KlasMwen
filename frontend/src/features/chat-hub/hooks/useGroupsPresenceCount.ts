import { useEffect } from "react";

import { chatSocketService } from "@/features/chat/services/socketService";
import { usePresenceStore } from "@/stores/presence.store";

export const useGroupsPresenceCount = (groupIds: string[]) => {
  const { updateGroupActivityCounts } = usePresenceStore();

  useEffect(() => {
    if (groupIds.length === 0) {
      return;
    }

    chatSocketService.startDiscoveryWatch(groupIds);

    const handlePresenceCountsUpdate = (data: {
      counts: Record<string, number>;
    }) => {
      updateGroupActivityCounts(data.counts);
    };

    const unsubscribe = chatSocketService.onDiscoveryWatch(
      handlePresenceCountsUpdate,
    );
    return () => {
      unsubscribe();
      chatSocketService.stopDiscoveryWatch(groupIds);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(groupIds)]);
};
