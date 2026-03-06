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
  const { data: groups = [], isLoading: isLoadingCircles } =
    useStudyCirclesQuery();

  const { data: selectedCircle, isLoading: isLoadingCircle } =
    useStudyCircleQuery(circleId ?? "");

  const { data: members = [], isLoading: isLoadingMembers } =
    useCircleMembersQuery(circleId ?? "");

  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useCircleMessagesQuery(circleId ?? "");

  const messages = useMemo(
    () =>
      messagesData
        ? [...messagesData.pages.flatMap((p) => p.data)].reverse()
        : [],
    [messagesData],
  );

  return {
    groups,
    selectedCircle,
    members,
    messages,
    isLoadingCircles,
    isLoadingCircle,
    isLoadingMembers,
    isLoadingMessages,
    isFetchingNextPage,
    pagination: { fetchNextPage, hasNextPage },
  };
};
