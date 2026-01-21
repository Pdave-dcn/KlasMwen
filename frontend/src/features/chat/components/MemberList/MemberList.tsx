import { ScrollArea } from "@/components/ui/scroll-area";
import type { EnrichedChatMember } from "@/zodSchemas/chat.zod";

import { Header } from "./Header";
import { getOnlineCount, sortMembers } from "./helpers";
import { LoadingState } from "./LoadingState";
import { MemberItem } from "./MemberItem";
// 1. Import ScrollArea

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
  const sortedMembers = sortMembers(members);
  const onlineCount = getOnlineCount(members);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <Header onlineCount={onlineCount} totalCount={members.length} />

      <div className="flex-1 min-h-0 w-full overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="p-2 w-full flex flex-col min-w-0">
            {isLoading ? (
              <LoadingState />
            ) : (
              <div className="space-y-0.5 w-full min-w-0">
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
        </ScrollArea>
      </div>
    </div>
  );
};
