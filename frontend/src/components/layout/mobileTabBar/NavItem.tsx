import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification.store";

interface NavItem {
  title: string;
  url?: string;
  action?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavItemProps {
  item: NavItem;
  onCreateClick?: () => void;
}

export const NavItem = ({ item, onCreateClick }: NavItemProps) => {
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isNotificationItem = item.title === "Notifications";
  const showBadge = isNotificationItem && unreadCount > 0;

  if (item.action) {
    return (
      <button
        onClick={onCreateClick}
        className="flex gap-1.5 items-center text-muted-foreground"
      >
        <item.icon className="h-6 w-6 mb-0.5" />
      </button>
    );
  }

  return (
    <li>
      <NavLink
        to={item.url as string}
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center text-xs transition-colors px-2 py-1",
            isActive
              ? "text-primary font-medium"
              : "text-muted-foreground hover:text-foreground"
          )
        }
      >
        {({ isActive }) => (
          <div className="relative">
            <item.icon
              className={cn(
                "h-6 w-6 mb-0.5",
                isActive ? "stroke-primary" : "stroke-muted-foreground"
              )}
            />
            {showBadge && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        )}
      </NavLink>
    </li>
  );
};
