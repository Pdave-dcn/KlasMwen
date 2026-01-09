import { MessageCircle, Reply, Heart, Bell } from "lucide-react";
import { toast } from "sonner";

import type { NotificationType } from "@/zodSchemas/notification.zod";

const getNotificationConfig = (type: NotificationType) => {
  switch (type) {
    case "COMMENT_ON_POST":
      return {
        message: "New comment on your post",
        icon: MessageCircle,
      };
    case "REPLY_TO_COMMENT":
      return {
        message: "New reply to your comment",
        icon: Reply,
      };
    case "LIKE":
      return {
        message: "Someone liked your post",
        icon: Heart,
      };
    default:
      return {
        message: "You have a new notification",
        icon: Bell,
      };
  }
};

export const showNotificationToast = (type: NotificationType) => {
  const config = getNotificationConfig(type);

  toast(config.message, {
    description: "Click to view your notifications",
    icon: <config.icon size={16} />,
    action: {
      label: "View",
      onClick: () => {
        window.location.href = "/notifications";
      },
    },
    duration: 5000,
  });
};
