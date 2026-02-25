import { ScrollArea } from "@/components/ui/scroll-area";
import type { CircleMember } from "@/zodSchemas/circle.zod";

import { Header } from "./Header";
import { LoadingState } from "./LoadingState";
import { MemberItem } from "./MemberItem";

interface MemberListProps {
  members: CircleMember[];
  isLoading: boolean;
  currentUserId?: string;
}

export const MemberList = ({
  members,
  isLoading,
  currentUserId,
}: MemberListProps) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <Header totalCount={members.length} />

      <div className="flex-1 min-h-0 w-full overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="p-2 w-full flex flex-col min-w-0">
            {isLoading ? (
              <LoadingState />
            ) : (
              <div className="space-y-0.5 w-full min-w-0">
                {members.map((member) => (
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
