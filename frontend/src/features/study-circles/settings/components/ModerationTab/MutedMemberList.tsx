import { VolumeX, Volume2 } from "lucide-react";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/utils/getInitials.util";
import type { CircleMember } from "@/zodSchemas/circle.zod";

interface MutedMembersListProps {
  mutedMembers: CircleMember[];
  onUnmute: (member: CircleMember) => void;
}

export function MutedMembersList({
  mutedMembers,
  onUnmute,
}: MutedMembersListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <VolumeX className="h-4 w-4 text-destructive" />
        <h4 className="font-semibold text-foreground">Muted Members</h4>
        {mutedMembers.length > 0 && (
          <Badge variant="secondary" className="rounded-lg text-xs">
            {mutedMembers.length}
          </Badge>
        )}
      </div>

      {mutedMembers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Volume2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No muted members</p>
          <p className="text-xs mt-1">Everyone can speak freely!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {mutedMembers.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={member.user.avatar?.url}
                    alt={member.user.username}
                  />
                  <AvatarFallback>
                    {getInitials(member.user.username)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium text-foreground">
                  {member.user.username}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5"
                onClick={() => onUnmute(member)}
              >
                <Volume2 className="h-3.5 w-3.5" />
                Unmute
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
