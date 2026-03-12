import { useState } from "react";

import { Crown, Shield, Users, Search, Link, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CircleGate } from "@/features/study-circles/security/CircleGate";
import {
  type CircleMember,
  type StudyCircleRole as MemberRole,
} from "@/zodSchemas/circle.zod";

import { MUTE_DURATIONS } from "../../types";

import { MemberRow } from "./MemberRow";

interface MembersTabProps {
  members: CircleMember[];
}

const roleConfig: Record<
  MemberRole,
  { icon: typeof Crown; label: string; color: string }
> = {
  OWNER: { icon: Crown, label: "Owner", color: "text-amber-500" },
  MODERATOR: { icon: Shield, label: "Mod", color: "text-primary" },
  MEMBER: { icon: Users, label: "Member", color: "text-muted-foreground" },
};

export const MembersTab = ({ members }: MembersTabProps) => {
  const [search, setSearch] = useState("");
  const [muteTarget, setMuteTarget] = useState<CircleMember | null>(null);

  const filtered = members.filter((m) =>
    m.user.username.toLowerCase().includes(search.toLowerCase()),
  );

  const handleKick = (member: CircleMember) => {
    toast.success(`${member.user.username} has been removed from the circle.`);
  };

  const handleRoleChange = (member: CircleMember, newRole: MemberRole) => {
    toast.success(
      `${member.user.username} is now a ${roleConfig[newRole].label}.`,
    );
  };

  const handleMute = (member: CircleMember, duration: number | null) => {
    const label = duration ? `${duration} minutes` : "indefinitely";
    toast.success(`${member.user.username} has been muted ${label}.`);
    setMuteTarget(null);
  };

  const handleCopyInvite = async () => {
    await navigator.clipboard.writeText(`https://studychat.app/invite/abc123`);
    toast.success("Invite link copied!");
  };

  return (
    <div className="space-y-6">
      {/* Invite Section — OWNER and MODERATOR only */}
      <CircleGate resource="circles" action="invite">
        <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Invite Members
          </h4>
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address..."
              className="rounded-xl flex-1"
            />
            <Button size="sm" className="rounded-xl">
              Invite
            </Button>
          </div>
          <button
            onClick={handleCopyInvite}
            className="flex items-center gap-2 text-xs text-primary hover:underline"
          >
            <Link className="h-3 w-3" />
            Copy invite link
          </button>
        </div>
      </CircleGate>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Member Count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} member{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Member List */}
      <div className="space-y-1">
        {filtered.map((member) => (
          <MemberRow
            key={member.userId}
            member={member}
            onKick={handleKick}
            onRoleChange={handleRoleChange}
            onMute={handleMute}
          />
        ))}
      </div>

      {/* Mute Dialog */}
      <Dialog open={!!muteTarget} onOpenChange={() => setMuteTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Mute {muteTarget?.user.username}</DialogTitle>
            <DialogDescription>
              Choose how long to mute this member. They won't be able to send
              messages.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {MUTE_DURATIONS.map((d) => (
              <Button
                key={d.label}
                variant="outline"
                className="rounded-xl"
                onClick={() => muteTarget && handleMute(muteTarget, d.value)}
              >
                {d.label}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setMuteTarget(null)}
              className="rounded-xl"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
