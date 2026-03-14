import { useState } from "react";

import { toast } from "sonner";

import { useSetCircleMemberMuteMutation } from "@/queries/circle/members.query";
import { useCircleStore } from "@/stores/circle.store";
import { type CircleMember } from "@/zodSchemas/circle.zod";

import type { MuteDuration } from "../types";

interface UseMembersTabProps {
  members: CircleMember[];
}

export function useMembersTab({ members }: UseMembersTabProps) {
  const [search, setSearch] = useState("");
  const [muteTarget, setMuteTarget] = useState<CircleMember | null>(null);

  const currentCircleId =
    useCircleStore((state) => state.selectedCircleId) ?? "";

  const setMuteMutation = useSetCircleMemberMuteMutation(currentCircleId);

  const filtered = members.filter((m) =>
    m.user.username.toLowerCase().includes(search.toLowerCase()),
  );

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
    search,
    setSearch,
    muteTarget,
    setMuteTarget,
    filtered,
    handlers: {
      handleMute,
      handleUnmute,
      handleCopyInvite,
      handleCloseMuteDialog,
    },
  };
}
