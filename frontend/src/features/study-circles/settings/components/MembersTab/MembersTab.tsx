import { Search, Link, Mail } from "lucide-react";

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
import { type CircleMember } from "@/zodSchemas/circle.zod";

import { useMembersTab } from "../../hooks/useMembersTab";
import { MUTE_DURATIONS } from "../../types";

import { MemberRow } from "./MemberRow";

interface MembersTabProps {
  members: CircleMember[];
}

export const MembersTab = ({ members }: MembersTabProps) => {
  const { search, setSearch, muteTarget, filtered, handlers } = useMembersTab({
    members,
  });

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
            onClick={handlers.handleCopyInvite}
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
            onMute={handlers.handleMute}
          />
        ))}
      </div>

      {/* Mute Dialog */}
      <Dialog open={!!muteTarget} onOpenChange={handlers.handleCloseMuteDialog}>
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
                onClick={() =>
                  muteTarget && handlers.handleMute(muteTarget, d.value)
                }
              >
                {d.label}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={handlers.handleCloseMuteDialog}
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
