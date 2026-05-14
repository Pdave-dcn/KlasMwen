import { formatDistanceToNow } from "date-fns";
import { Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { getCircleInitials } from "@/utils/getInitials.util";
import type { StudyCircle } from "@/zodSchemas/circle.zod";

interface CircleListItemProps {
  circle: StudyCircle;
  isSelected: boolean;
  onClick: () => void;
}

export const CircleListItem = ({
  circle,
  isSelected,
  onClick,
}: CircleListItemProps) => {
  const formattedTime = circle.latestMessage
    ? formatDistanceToNow(new Date(circle.latestMessage.createdAt), {
        addSuffix: false,
      })
    : "";

  // Generate color based on circle name
  const colorIndex = circle.name.charCodeAt(0) % 6;
  const bgColors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-violet-500",
    "bg-cyan-500",
  ];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer min-w-0 overflow-hidden",
        "hover:bg-muted/80 dark:hover:bg-accent-",
        isSelected ? "bg-muted dark:bg-accent shadow-sm" : "bg-transparent",
      )}
    >
      {/* Group Avatar */}
      {circle.avatar ? (
        <img
          src={circle.avatar.url}
          alt="avatar"
          className="h-12 w-12 rounded-xl object-cover"
        />
      ) : (
        <div
          className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center text-white font-semibold",
            bgColors[colorIndex],
          )}
        >
          {getCircleInitials(circle.name)}
        </div>
      )}

      {/* Study circle Info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-foreground truncate flex-1">
            {circle.name}
          </h3>
          {circle.latestMessage && (
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {formattedTime}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-sm text-muted-foreground truncate flex-1">
            {circle.latestMessage ? (
              <>
                <span className="font-medium shrink-0">
                  {circle.latestMessage.sender.username}:
                </span>{" "}
                {circle.latestMessage.content}
              </>
            ) : (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {`${circle.memberCount} ${circle.memberCount === 1 ? "member" : "members"}`}
              </span>
            )}
          </p>

          {circle.unreadCount > 0 && (
            <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
              {circle.unreadCount > 99 ? "99+" : circle.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
