import { useState } from "react";

import {
  Crown,
  Shield,
  Users,
  Search,
  MoreVertical,
  UserMinus,
  ShieldPlus,
  ShieldMinus,
  VolumeX,
  Link,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type StudyCircleRole as MemberRole } from "@/zodSchemas/circle.zod";

import { type SettingsMember, MUTE_DURATIONS } from "./types";

interface MembersTabProps {
  members: SettingsMember[];
  userRole: MemberRole;
  currentUserId: string;
}

const roleConfig: Record<
  MemberRole,
  { icon: typeof Crown; label: string; color: string }
> = {
  OWNER: { icon: Crown, label: "Owner", color: "text-amber-500" },
  MODERATOR: { icon: Shield, label: "Mod", color: "text-primary" },
  MEMBER: { icon: Users, label: "Member", color: "text-muted-foreground" },
};

export function MembersTab({
  members,
  userRole,
  currentUserId,
}: MembersTabProps) {
  const [search, setSearch] = useState("");
  const [muteTarget, setMuteTarget] = useState<SettingsMember | null>(null);
  const canManage = userRole === "OWNER" || userRole === "MODERATOR";

  const filtered = members.filter((m) =>
    m.username.toLowerCase().includes(search.toLowerCase()),
  );

  const canActOn = (target: SettingsMember) => {
    if (!canManage) return false;
    if (target.id === currentUserId) return false;
    if (target.role === "OWNER") return false;
    if (userRole === "MODERATOR" && target.role === "MODERATOR") return false;
    return true;
  };

  const handleKick = (member: SettingsMember) => {
    toast.success(`${member.username} has been removed from the circle.`);
  };

  const handleRoleChange = (member: SettingsMember, newRole: MemberRole) => {
    toast.success(`${member.username} is now a ${roleConfig[newRole].label}.`);
  };

  const handleMute = (member: SettingsMember, duration: number | null) => {
    const label = duration ? `${duration} minutes` : "indefinitely";
    toast.success(`${member.username} has been muted ${label}.`);
    setMuteTarget(null);
  };

  const handleCopyInvite = async () => {
    await navigator.clipboard.writeText(`https://studychat.app/invite/abc123`);
    toast.success("Invite link copied!");
  };

  return (
    <div className="space-y-6">
      {/* Invite Section */}
      {canManage && (
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
      )}

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
        {filtered.map((member) => {
          const config = roleConfig[member.role];
          const RoleIcon = config.icon;

          return (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {member.username[0].toUpperCase()}
                </div>
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                    member.isOnline
                      ? "bg-[hsl(var(--chat-online))]"
                      : "bg-[hsl(var(--chat-offline))]",
                  )}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {member.username}
                    {member.id === currentUserId && (
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
              {canActOn(member) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl">
                    {/* Role changes */}
                    {userRole === "OWNER" && (
                      <>
                        {member.role === "MEMBER" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleRoleChange(member, "MODERATOR")
                            }
                          >
                            <ShieldPlus className="h-4 w-4 mr-2" />
                            Promote to Mod
                          </DropdownMenuItem>
                        )}
                        {member.role === "MODERATOR" && (
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member, "MEMBER")}
                          >
                            <ShieldMinus className="h-4 w-4 mr-2" />
                            Demote to Member
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                      </>
                    )}

                    {/* Mute */}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <VolumeX className="h-4 w-4 mr-2" />
                        Mute
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="rounded-xl">
                        {MUTE_DURATIONS.map((d) => (
                          <DropdownMenuItem
                            key={d.label}
                            onClick={() => handleMute(member, d.value)}
                          >
                            {d.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator />

                    {/* Kick */}
                    <DropdownMenuItem
                      onClick={() => handleKick(member)}
                      className="text-destructive focus:text-destructive"
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remove from Circle
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      {/* Mute Dialog (kept for potential direct mute action) */}
      <Dialog open={!!muteTarget} onOpenChange={() => setMuteTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Mute {muteTarget?.username}</DialogTitle>
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
}
