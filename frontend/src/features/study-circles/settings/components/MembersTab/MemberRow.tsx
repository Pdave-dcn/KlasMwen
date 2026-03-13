import {
  MoreVertical,
  UserMinus,
  ShieldPlus,
  ShieldMinus,
  VolumeX,
  Users,
  Shield,
  Crown,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useCircleStore } from "@/stores/circle.store";
import { usePresenceStore } from "@/stores/presence.store";
import { getInitials } from "@/utils/getInitials.util";
import {
  type CircleMember,
  type StudyCircleRole as MemberRole,
} from "@/zodSchemas/circle.zod";

import { useCircleMemberPermissions } from "../../../security/useCircleMemberPermission";
import { useMemberRow } from "../../hooks/useMemberRow";
import { MUTE_DURATIONS } from "../../types";

interface MemberRowProps {
  member: CircleMember;
  onMute: (member: CircleMember, duration: number | null) => void;
}

const roleConfig: Record<
  MemberRole,
  { icon: typeof Crown; label: string; color: string }
> = {
  OWNER: { icon: Crown, label: "Owner", color: "text-amber-500" },
  MODERATOR: { icon: Shield, label: "Mod", color: "text-primary" },
  MEMBER: { icon: Users, label: "Member", color: "text-muted-foreground" },
};

export function MemberRow({ member, onMute }: MemberRowProps) {
  const config = roleConfig[member.role];
  const RoleIcon = config.icon;

  const onlineUsers = usePresenceStore((state) => state.onlineUsers);
  const onlineMembers = useCircleStore((state) => state.onlineMemberIds);
  const currentUserId = useCircleStore((state) => state.currentUser?.id);

  const isOnline =
    onlineUsers.has(member.userId) || onlineMembers.has(member.userId);

  const { canRemove, canUpdateRole, canMute } =
    useCircleMemberPermissions(member);

  const { handlers, pending } = useMemberRow(member);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar>
          <AvatarImage
            src={member.user.avatar?.url}
            alt={member.user.username}
          />
          <AvatarFallback>{getInitials(member.user.username)}</AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
            isOnline ? "bg-emerald-500" : "bg-muted-foreground/50",
          )}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {member.user.username}
            {member.userId === currentUserId && (
              <span className="text-primary ml-1">(You)</span>
            )}
          </span>
          {member.isMuted && (
            <VolumeX className="h-3.5 w-3.5 text-destructive shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <RoleIcon className={cn("h-3 w-3", config.color)} />
          <span>{config.label}</span>
        </div>
      </div>

      {/* Role Badge */}
      <Badge
        variant={member.role === "OWNER" ? "default" : "secondary"}
        className={cn(
          "rounded-lg text-[10px] px-2 py-0.5",
          member.role === "OWNER" &&
            "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10",
          member.role === "MODERATOR" &&
            "bg-primary/10 text-primary border-primary/20 hover:bg-primary/10",
        )}
      >
        {config.label}
      </Badge>

      {/* Actions */}
      {canRemove && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            {canUpdateRole && (
              <>
                {member.role === "MEMBER" && (
                  <DropdownMenuItem
                    onClick={() => handlers.handleRoleChange("MODERATOR")}
                    disabled={pending.updatingRole}
                  >
                    <ShieldPlus className="h-4 w-4 mr-2" />
                    Promote to Mod
                  </DropdownMenuItem>
                )}
                {member.role === "MODERATOR" && (
                  <DropdownMenuItem
                    onClick={() => handlers.handleRoleChange("MEMBER")}
                    disabled={pending.updatingRole}
                  >
                    <ShieldMinus className="h-4 w-4 mr-2" />
                    Demote to Member
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}

            {canMute && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Mute
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="rounded-xl">
                  {MUTE_DURATIONS.map((d) => (
                    <DropdownMenuItem
                      key={d.label}
                      onClick={() => onMute(member, d.value)}
                    >
                      {d.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handlers.handleKick}
              className="text-destructive focus:text-destructive"
              disabled={pending.kicking}
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Remove from Circle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
