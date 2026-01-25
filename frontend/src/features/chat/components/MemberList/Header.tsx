import { Users } from "lucide-react";

import { useChatStore } from "@/stores/chat.store";

interface HeaderProps {
  totalCount: number;
}

export const Header = ({ totalCount }: HeaderProps) => {
  const onlineCount = useChatStore((state) => state.onlineMemberIds.size);
  return (
    <div className="p-4 border-b border-border">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        Members
      </h3>
      <p className="text-xs text-muted-foreground mt-1">
        {onlineCount} online • {totalCount} total
      </p>
    </div>
  );
};
