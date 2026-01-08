import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification.store";

import type { NAV_ITEMS } from "./constants";

interface NavItemProps {
  item: (typeof NAV_ITEMS)[number];
  isLabelHidden: boolean;
  onCreateClick?: () => void;
}

export const NavItem = ({
  item,
  isLabelHidden,
  onCreateClick,
}: NavItemProps) => {
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isNotificationItem = item.title === "Notifications";
  const showBadge = isNotificationItem && unreadCount > 0;

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
      className={({ isActive }) =>
        cn(
          "flex gap-1.5 items-center transition-colors relative",
          isActive
            ? "text-primary font-medium"
            : "text-muted-foreground hover:text-foreground"
        )
      }
    >
      <div className="relative">
        <item.icon className="h-7 w-7" />
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
