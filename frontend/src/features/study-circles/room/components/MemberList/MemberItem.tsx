import { Crown, Shield, Users, VolumeX, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCircleStore } from "@/stores/circle.store";
import { usePresenceStore } from "@/stores/presence.store";
import type {
  CircleMember,
  StudyCircleRole as MemberRole,
} from "@/zodSchemas/circle.zod";

import { UserAvatar } from "../UserAvatar";

const roleConfig: Record<
  MemberRole,
  { icon: LucideIcon; label: string; color: string }
> = {
  OWNER: { icon: Crown, label: "Owner", color: "text-amber-500" },
  MODERATOR: { icon: Shield, label: "Mod", color: "text-blue-500" },
  MEMBER: { icon: Users, label: "Member", color: "text-muted-foreground" },
};

export const MemberItem = ({
  member,
  isCurrentUser,
}: {
  member: CircleMember;
  isCurrentUser: boolean;
}) => {
  const config = roleConfig[member.role];
  const RoleIcon = config.icon;

  const isGloballyOnline = usePresenceStore((state) =>
    state.onlineUsers.has(member.userId),
  );

  const isSyncOnline = useCircleStore((state) =>
    state.onlineMemberIds.has(member.userId),
  );

  const isPresent = useCircleStore((state) =>
    state.presentMemberIds.has(member.userId),
  );

  const isOnline = isGloballyOnline || isSyncOnline;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-lg transition-colors group",
        "hover:bg-muted/50",
        isPresent && "bg-primary/5",
      )}
    >
      <div className="relative">
        <UserAvatar
          user={member.user}
          isOnline={isOnline || isCurrentUser}
          size="sm"
          showOnlineStatus
        />

        {/* Presence Indicator: Pulsing ring around avatar */}
        {isPresent && (
          <span
            data-testid="presence-indicator"
            className="absolute -inset-1 rounded-full border-2 border-primary/40 animate-pulse pointer-events-none"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={cn(
                "text-sm font-medium truncate",
                isCurrentUser && "text-primary",
                isPresent && !isCurrentUser && "text-foreground",
              )}
            >
              {member.user.username}
              {isCurrentUser && " (You)"}
            </span>

            {member.isMuted && (
              <VolumeX className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
          </div>

          {isPresent && !isCurrentUser && (
            <div
              data-testid="present-text-indicator"
              className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider animate-in fade-in zoom-in duration-300"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              Present
            </div>
          )}
        </div>

        <div
          data-testid="role-indicator"
          className="flex items-center gap-1 text-xs text-muted-foreground"
        >
          <RoleIcon className={cn("h-3 w-3", config.color)} />
          <span>{config.label}</span>
        </div>
      </div>
    </div>
  );
};
