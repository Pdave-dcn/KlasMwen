import { useState } from "react";

import { MessageSquare, Search } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { ChatGroup } from "@/zodSchemas/chat.zod";

import { ChatGroupItem } from "./ChatGroupItem";

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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Chats
        </h2>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-muted rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Group List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={`item-${i + 1}`}
                className="flex items-center gap-3 p-3"
              >
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="space-y-1">
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
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No chats found</p>
          </div>
        )}
      </div>
    </div>
  );
};
