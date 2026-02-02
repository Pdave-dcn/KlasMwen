import { formatDistanceToNow } from "date-fns";

import { cn } from "@/lib/utils";

import { PresenceIndicator } from "../PresenceIndicator";

export interface RecentGroup {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: {
    senderName: string;
    content: string;
    createdAt: string;
  };
  activeMembers: number;
}

interface RecentGroupCardProps {
  group: RecentGroup;
  onClick: () => void;
}

export const RecentGroupCard = ({ group, onClick }: RecentGroupCardProps) => {
  const initials = group.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const timeAgo = formatDistanceToNow(new Date(group.lastMessage.createdAt), {
    addSuffix: true,
  });

  // Truncate message to ~30 chars
  const messagePreview =
    group.lastMessage.content.length > 30
      ? `${group.lastMessage.content.slice(0, 30)}...`
      : group.lastMessage.content;

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
        {/* Avatar */}
        <div className="shrink-0 w-10 h-10 rounded-lg bg-linear-to-br from-primary to-primary/70 flex items-center justify-center">
          <span className="text-xs font-semibold text-primary-foreground">
            {initials}
          </span>
        </div>

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
              {group.lastMessage.senderName}:
            </span>{" "}
            {messagePreview}
          </p>

          {/* Presence */}
          <PresenceIndicator activeCount={group.activeMembers} />
        </div>
      </div>
    </button>
  );
};
