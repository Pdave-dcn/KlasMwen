import { useState } from "react";

import { toast } from "sonner";

import { type CircleMember } from "@/zodSchemas/circle.zod";

interface UseMembersTabProps {
  members: CircleMember[];
}

export function useMembersTab({ members }: UseMembersTabProps) {
  const [search, setSearch] = useState("");
  const [muteTarget, setMuteTarget] = useState<CircleMember | null>(null);

  const filtered = members.filter((m) =>
    m.user.username.toLowerCase().includes(search.toLowerCase()),
  );

  const handleMute = (member: CircleMember, duration: number | null) => {
    const label = duration ? `${duration} minutes` : "indefinitely";
    toast.success(`${member.user.username} has been muted ${label}.`);
    setMuteTarget(null);
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
      handleCopyInvite,
      handleCloseMuteDialog,
    },
  };
}
