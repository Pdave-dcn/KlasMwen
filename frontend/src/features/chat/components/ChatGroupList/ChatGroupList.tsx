import { useState } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatGroup } from "@/zodSchemas/chat.zod";

import { ChatGroupItem } from "./ChatGroupItem";
import { EmptyState } from "./EmptyState";
import { Header } from "./Header";
import { LoadingState } from "./LoadingState";

interface ChatGroupListProps {
  groups: ChatGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  isLoading: boolean;
}

export const ChatGroupList = ({
  groups,
  selectedGroupId,
  onSelectGroup,
  isLoading,
}: ChatGroupListProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="flex-1 min-h-0 w-full relative">
        <ScrollArea className="h-full w-full">
          <div className="p-2 w-full inline-table table-fixed min-w-0">
            {isLoading ? (
              <LoadingState />
            ) : filteredGroups.length > 0 ? (
              <div className="flex flex-col gap-1 w-full min-w-0">
                {filteredGroups.map((group) => (
                  <ChatGroupItem
                    key={group.id}
                    group={group}
                    isSelected={group.id === selectedGroupId}
                    onClick={() => onSelectGroup(group.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
