import { Users } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type {
  EnrichedChatMember,
  ChatRole as MemberRole,
} from "@/zodSchemas/chat.zod";

import { MemberItem } from "./MemberItem";

interface MemberListProps {
  members: EnrichedChatMember[];
  isLoading: boolean;
  currentUserId?: string;
}

export const MemberList = ({
  members,
  isLoading,
  currentUserId,
}: MemberListProps) => {
  // Sort members: online first, then by role
  const sortedMembers = [...members].sort((a, b) => {
    // Online status first
    if (a.isOnline !== b.isOnline) {
      return a.isOnline ? -1 : 1;
    }
    // Then by role
    const roleOrder: MemberRole[] = ["OWNER", "MODERATOR", "MEMBER"];
    return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role);
  });

  const onlineCount = members.filter((m) => m.isOnline).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Members
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {onlineCount} online • {members.length} total
        </p>
      </div>

      {/* Member List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={`item-${i + 1}`}
                className="flex items-center gap-3 p-2.5"
              >
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {sortedMembers.map((member) => (
              <MemberItem
                key={member.userId}
                member={member}
                isCurrentUser={member.user.id === currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
