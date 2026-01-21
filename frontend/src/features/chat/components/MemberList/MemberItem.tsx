import { Crown, Shield, Users, VolumeX, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  EnrichedChatMember,
  ChatRole as MemberRole,
} from "@/zodSchemas/chat.zod";

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
  member: EnrichedChatMember;
  isCurrentUser: boolean;
}) => {
  const config = roleConfig[member.role];
  const RoleIcon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-lg transition-colors",
        "hover:bg-muted/50",
      )}
    >
      <UserAvatar
        user={member.user}
        isOnline={member.isOnline}
        size="sm"
        showOnlineStatus
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-sm font-medium truncate",
              isCurrentUser && "text-primary",
            )}
          >
            {member.user.username}
            {isCurrentUser && " (You)"}
          </span>

          {member.mutedUntil && (
            <VolumeX className="h-3.5 w-3.5 text-destructive shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <RoleIcon className={cn("h-3 w-3", config.color)} />
          <span>{config.label}</span>
        </div>
      </div>
    </div>
  );
};
