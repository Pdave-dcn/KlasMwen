import { useMemo, useState } from "react";

import { toast } from "sonner";

import { useDebouncedValue } from "@/features/search/hooks/useDebouncedValue";
import {
  useCircleMembersQuery,
  useSearchCircleMembersQuery,
  useSetCircleMemberMuteMutation,
} from "@/queries/circle/members.query";
import { useCircleStore } from "@/stores/circle.store";
import { type CircleMember } from "@/zodSchemas/circle.zod";

import type { MuteDuration } from "../types";

export function useMembersTab() {
  const [search, setSearch] = useState("");
  const [muteTarget, setMuteTarget] = useState<CircleMember | null>(null);

  const currentCircleId = useCircleStore((state) => state.selectedCircleId);

  // Debounce the search input so we don't fire a request on every keystroke
  const debouncedSearch = useDebouncedValue(search, 400);

  const isSearching = debouncedSearch.trim().length > 0;

  // Base paginated query — used when there's no active search
  const {
    data: membersData,
    isLoading: isLoadingMembers,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useCircleMembersQuery(currentCircleId);

  const allMembers = useMemo(
    () => membersData?.pages.flatMap((p) => p.data) ?? [],
    [membersData],
  );

  // Search query — only fires when debouncedSearch is non-empty
  const { data: searchResults, isLoading: isLoadingSearch } =
    useSearchCircleMembersQuery(currentCircleId, debouncedSearch);

  // When searching, use backend results. Otherwise show the paginated list.
  const members: CircleMember[] = isSearching
    ? (searchResults ?? [])
    : allMembers;

  const isLoadingMembers_ = isSearching ? isLoadingSearch : isLoadingMembers;

  const setMuteMutation = useSetCircleMemberMuteMutation(currentCircleId);

  const handleMute = (
    member: CircleMember,
    duration: MuteDuration["value"],
  ) => {
    setMuteMutation.mutate({ userId: member.user.id, muted: true, duration });
  };

  const handleUnmute = (member: CircleMember) => {
    setMuteMutation.mutate({ userId: member.user.id, muted: false });
  };

  // todo: implement invite functionality and replace the hardcoded invite link
  const handleCopyInvite = async () => {
    await navigator.clipboard.writeText(`https://studychat.app/invite/abc123`);
    toast.success("Invite link copied!");
  };

  const handleCloseMuteDialog = () => setMuteTarget(null);

  return {
    // Data
    members,
    isLoadingMembers: isLoadingMembers_,
    // Search
    search,
    setSearch,
    isSearching,
    // Mute dialog
    muteTarget,
    setMuteTarget,
    // Pagination — disabled while searching, backend handles filtering
    pagination: {
      hasNextPage: isSearching ? false : !!hasNextPage,
      isFetchingNextPage: isSearching ? false : isFetchingNextPage,
      fetchNextPage,
    },
    // Handlers
    handlers: {
      handleMute,
      handleUnmute,
      handleCopyInvite,
      handleCloseMuteDialog,
    },
  };
}
