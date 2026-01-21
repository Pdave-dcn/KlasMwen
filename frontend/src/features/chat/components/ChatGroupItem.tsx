import { formatDistanceToNow } from "date-fns";
import { Users } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChatGroup } from "@/zodSchemas/chat.zod";

interface ChatGroupItemProps {
  group: ChatGroup;
  isSelected: boolean;
  onClick: () => void;
}

export function ChatGroupItem({
  group,
  isSelected,
  onClick,
}: ChatGroupItemProps) {
  const formattedTime = group.latestMessage
    ? formatDistanceToNow(new Date(group.latestMessage.createdAt), {
        addSuffix: false,
      })
    : "";

  // Generate color based on group name
  const colorIndex = group.name.charCodeAt(0) % 6;
  const bgColors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-violet-500",
    "bg-cyan-500",
  ];

  const initials = group.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer",
        "hover:bg-muted/80 dark:hover:bg-muted",
        isSelected ? "bg-muted shadow-sm" : "bg-transparent",
      )}
    >
      {/* Group Avatar */}
      {/* {group.avatar ? (
        <img
          src={group.avatar}
          alt={group.name}
          className="h-12 w-12 rounded-xl object-cover"
        />
      ) : (
        <div
          className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center text-white font-semibold",
            bgColors[colorIndex],
          )}
        >
          {initials}
        </div>
      )} */}
      <div
        className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center text-white font-semibold",
          bgColors[colorIndex],
        )}
      >
        {initials}
      </div>

      {/* Group Info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-foreground truncate">
            {group.name}
          </h3>
          {group.latestMessage && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formattedTime}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-sm text-muted-foreground truncate">
            {group.latestMessage ? (
              <>
                <span className="font-medium">
                  {group.latestMessage.sender.username}:
                </span>{" "}
                {group.latestMessage.content}
              </>
            ) : (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {group.memberCount} members
              </span>
            )}
          </p>

          {group.unreadCount > 0 && (
            <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
              {group.unreadCount > 99 ? "99+" : group.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
