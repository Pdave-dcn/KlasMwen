import { useMemo } from "react";

import {
  useCircleMembersQuery,
  useCircleMessagesQuery,
  useStudyCircleQuery,
  useStudyCirclesQuery,
} from "@/queries/circle";

/**
 * Aggregates all data required for the study circle chat UI.
 *
 * This hook fetches:
 * - The list of circles
 * - The selected circle details
 * - Circle members
 * - Circle messages with pagination
 *
 * It also flattens and orders the message pages into a single list
 * that is easier for the UI to render.
 *
 * @param {string | null} circleId - ID of the active circle. If `null`,
 * circle-specific queries are disabled.
 */
export const useCircleData = (circleId: string | null) => {
  const { data: circles = [], isLoading: isLoadingCircles } =
    useStudyCirclesQuery();

  const { data: selectedCircle, isLoading: isLoadingCircle } =
    useStudyCircleQuery(circleId);

  const { data: rawMembers = [], isLoading: isLoadingMembers } =
    useCircleMembersQuery(circleId);

  // React Query keeps stale cache data even when queries are disabled (circleId is null).
  // Explicitly returning empty arrays when there is no active circle prevents stale
  // members and messages from remaining visible after leaving or deleting a circle.
  const members = circleId ? rawMembers : [];

  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useCircleMessagesQuery(circleId, 50);

  const rawMessages = useMemo(
    () =>
      messagesData
        ? [...messagesData.pages.flatMap((p) => p.data)].reverse()
        : [],
    [messagesData],
  );

  // Same reasoning as members, rawMessages may still hold cached pages from the
  // previously selected circle, so we clear them immediately when circleId is null
  // rather than waiting for the cache to be garbage collected.
  const messages = circleId ? rawMessages : [];

  return {
    data: {
      circles,
      selectedCircle,
      members,
      messages,
    },
    loading: {
      circles: isLoadingCircles,
      circle: isLoadingCircle,
      members: isLoadingMembers,
      messages: isLoadingMessages,
    },
    pagination: {
      messages: {
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
      },
    },
  };
};
