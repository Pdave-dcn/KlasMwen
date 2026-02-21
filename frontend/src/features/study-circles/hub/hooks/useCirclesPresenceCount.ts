import { useEffect } from "react";

import { usePresenceStore } from "@/stores/presence.store";

import { circleSocketService } from "../../services/socketService";

export const useCirclesPresenceCount = (circleIds: string[]) => {
  const { updateCircleActivityCounts } = usePresenceStore();

  useEffect(() => {
    if (circleIds.length === 0) {
      return;
    }

    circleSocketService.startDiscoveryWatch(circleIds);

    const handlePresenceCountsUpdate = (data: {
      counts: Record<string, number>;
    }) => {
      updateCircleActivityCounts(data.counts);
    };

    const unsubscribe = circleSocketService.onDiscoveryWatch(
      handlePresenceCountsUpdate,
    );
    return () => {
      unsubscribe();
      circleSocketService.stopDiscoveryWatch(circleIds);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(circleIds)]);
};
