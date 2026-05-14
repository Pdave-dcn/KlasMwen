import { Loader2, Search, Link, Mail } from "lucide-react";

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
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

import { useMembersTab } from "../../hooks/useMembersTab";
import { MUTE_DURATIONS } from "../../types";

import { MemberRow } from "./MemberRow";

export const MembersTab = () => {
  const {
    members,
    isLoadingMembers,
    search,
    setSearch,
    isSearching,
    muteTarget,
    pagination,
    handlers,
  } = useMembersTab();

  // Sentinel disabled while searching — backend handles filtering,
  // pagination of the base list is irrelevant during a search
  const bottomSentinelRef = useInfiniteScroll({
    hasNextPage: pagination.hasNextPage,
    isFetchingNextPage: pagination.isFetchingNextPage,
    fetchNextPage: pagination.fetchNextPage,
    enabled: !isSearching,
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
        {members.length} member{members.length !== 1 ? "s" : ""}
        {isSearching && " found"}
      </p>

      {/* Member List */}
      {isLoadingMembers ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-1">
          {members.length === 0 && isSearching ? (
            <p className="text-sm text-center text-muted-foreground py-6">
              No members found for "{search}"
            </p>
          ) : (
            members.map((member) => (
              <MemberRow
                key={member.userId}
                member={member}
                onMute={handlers.handleMute}
                onUnmute={handlers.handleUnmute}
              />
            ))
          )}

          {/* Sentinel — only active when not searching */}
          <div ref={bottomSentinelRef} />

          {/* Spinner for subsequent page loads */}
          {pagination.isFetchingNextPage && (
            <div className="flex justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}

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
