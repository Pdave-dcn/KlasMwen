import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification.store";

import type { NAV_ITEMS } from "./constants";

interface NavItemProps {
  item: (typeof NAV_ITEMS)[number];
  isLabelHidden: boolean;
  isActive: boolean;
  onCreateClick?: () => void;
}

export const NavItem = ({
  item,
  isLabelHidden,
  isActive,
  onCreateClick,
}: NavItemProps) => {
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isNotificationItem = item.title === "Notifications";
  const showBadge = isNotificationItem && unreadCount > 0;

  const activeStyles = isActive
    ? "text-primary font-medium"
    : "text-muted-foreground hover:text-foreground";

  if (item.action) {
    return (
      <button
        onClick={onCreateClick}
        className="flex gap-1.5 cursor-pointer items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <item.icon className="h-7 w-7" />
        <span className={cn(isLabelHidden ? "hidden" : "hidden lg:block")}>
          {item.title}
        </span>
      </button>
    );
  }

  return (
    <NavLink
      to={item.url as string}
      className={cn(
        "flex gap-1.5 items-center transition-colors relative",
        activeStyles,
      )}
    >
      <div className="relative">
        <item.icon className={cn("h-7 w-7", isActive && "text-primary")} />

        {showBadge && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>
      <span className={cn(isLabelHidden ? "hidden" : "hidden lg:block")}>
        {item.title}
      </span>
    </NavLink>
  );
};
