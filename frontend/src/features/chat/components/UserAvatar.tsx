import { cn } from "@/lib/utils";
import { getInitials } from "@/utils/getInitials.util";
import type { ChatAttachedUser } from "@/zodSchemas/chat.zod";

interface UserAvatarProps {
  user: ChatAttachedUser;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
  showOnlineStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

const statusSizeClasses = {
  sm: "h-2.5 w-2.5 border-[1.5px]",
  md: "h-3 w-3 border-2",
  lg: "h-3.5 w-3.5 border-2",
};

export function UserAvatar({
  user,
  isOnline,
  size = "md",
  showOnlineStatus = false,
  className,
}: UserAvatarProps) {
  const colorIndex = user.username.charCodeAt(0) % 6;
  const bgColors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-violet-500",
    "bg-cyan-500",
  ];

  return (
    <div className={cn("relative inline-flex", className)}>
      {user.avatar ? (
        <img
          src={user.avatar.url}
          alt={user.username}
          className={cn("rounded-full object-cover", sizeClasses[size])}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-full font-medium text-white",
            sizeClasses[size],
            bgColors[colorIndex],
          )}
        >
          {getInitials(user.username)}
        </div>
      )}
      {showOnlineStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-background",
            statusSizeClasses[size],
            isOnline ? "bg-emerald-500" : "bg-muted-foreground/50",
          )}
        />
      )}
    </div>
  );
}
