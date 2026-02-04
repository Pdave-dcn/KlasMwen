import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/utils/dateFormatter.util";
import { getGroupInitials } from "@/utils/getInitials.util";
import type { ChatGroup } from "@/zodSchemas/chat.zod";

import { PresenceIndicator } from "../PresenceIndicator";

interface RecentGroupCardProps {
  group: ChatGroup;
  onClick: () => void;
}

export const RecentGroupCard = ({ group, onClick }: RecentGroupCardProps) => {
  const timeAgo = formatTimeAgo(group.latestMessage?.createdAt ?? "");

  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 w-64 p-4 rounded-xl border bg-card text-left",
        "transition-all duration-200 hover:shadow-md hover:border-primary/30",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar>
          <AvatarImage src={group.avatar?.url} />
          <AvatarFallback>{getGroupInitials(group.name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-medium text-foreground truncate text-sm">
              {group.name}
            </h4>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {timeAgo}
            </span>
          </div>

          {/* Message preview */}
          <p className="text-xs text-muted-foreground truncate mb-2">
            <span className="font-medium text-foreground/80">
              {group.latestMessage
                ? `${group.latestMessage.sender.username}:`
                : "No messages yet"}
            </span>{" "}
            {group.latestMessage?.content ?? ""}
          </p>

          {/* Presence */}
          {/** Should be dynamic based on group members */}
          <PresenceIndicator activeCount={8} />
        </div>
      </div>
    </button>
  );
};
