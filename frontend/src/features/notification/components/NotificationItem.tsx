import { useNavigate } from "react-router-dom";

import { MessageCircle, Reply, Heart, ShieldAlert } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/utils/dateFormatter.util";
import { getInitials } from "@/utils/getInitials.util";
import type {
  NotificationType,
  NotificationWithRelations,
} from "@/zodSchemas/notification.zod";

interface NotificationItemProps {
  notification: NotificationWithRelations;
  onMarkAsRead: (id: number) => void;
}

const typeConfig: Record<
  NotificationType,
  { icon: React.ElementType; className: string; message: string }
> = {
  COMMENT_ON_POST: {
    icon: MessageCircle,
    className: "text-blue-500",
    message: "commented on your post",
  },
  REPLY_TO_COMMENT: {
    icon: Reply,
    className: "text-green-500",
    message: "replied to your comment",
  },
  LIKE: {
    icon: Heart,
    className: "text-rose-500",
    message: "liked your post",
  },
  REPORT_UPDATE: {
    icon: ShieldAlert,
    className: "text-amber-500",
    message: "Your report has been reviewed",
  },
};

export const NotificationItem = ({
  notification,
  onMarkAsRead,
}: NotificationItemProps) => {
  const navigate = useNavigate();

  const {
    icon: Icon,
    className: iconClassName,
    message,
  } = typeConfig[notification.type];

  const handleClick = async () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    if (notification.postId) {
      await navigate(`/@user/post/${notification.postId}`);
    } else if (notification.comment?.postId) {
      await navigate(`/@user/post/${notification.comment.postId}`);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      await handleClick();
    }
  };

  const handleNavigate = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    await navigate(`/profile/${userId}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors",
        "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        !notification.read && "bg-muted/30"
      )}
    >
      {/* Unread Indicator */}
      {!notification.read && (
        <span className="absolute left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
      )}

      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage
          src={notification.actor.Avatar.url}
          alt={notification.actor.username}
        />
        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
          {getInitials(notification.actor.username)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm",
              !notification.read ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {notification.type === "REPORT_UPDATE" ? (
              <span>{message}</span>
            ) : (
              <>
                <button
                  className="font-medium text-foreground hover:underline focus:outline-none focus:underline"
                  onClick={(e) => handleNavigate(e, notification.actorId)}
                >
                  {notification.actor.username}
                </button>{" "}
                <span>{message}</span>
              </>
            )}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatTimeAgo(notification.createdAt)}
          </span>
        </div>

        {/* Target */}
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {notification.commentId
            ? notification.comment?.content
            : notification.post?.title}
        </p>
      </div>

      {/* Type Icon */}
      <div className={cn("shrink-0 mt-0.5", iconClassName)}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
};
