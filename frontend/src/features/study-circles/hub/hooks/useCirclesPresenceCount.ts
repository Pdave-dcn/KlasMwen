import { useEffect } from "react";

import { usePresenceStore } from "@/stores/presence.store";

import { circleSocketService } from "../../services/socketService";

/**
 * Watches real-time presence counts for multiple study circles.
 *
 * This hook:
 * - Subscribes to socket updates for the provided circle IDs
 * - Receives the number of active/present members per circle
 * - Updates the presence store with the latest counts
 * - Stops watching when the component unmounts or the IDs change
 *
 * Used for features like showing how many members are currently
 * active in each circle (e.g., in discovery or circle lists).
 *
 * @param {string[]} circleIds - List of circle IDs to watch for
 * presence count updates.
 */
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
