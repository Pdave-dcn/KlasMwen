import { useNavigate } from "react-router-dom";

import {
  Menu,
  Shield,
  User,
  Settings,
  Bookmark,
  LogOut,
  Bell,
} from "lucide-react";

import { logOut as apiLogOut } from "@/api/auth.api";
import RequireRole from "@/components/RequireRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThemeToggle } from "@/hooks/useThemeToggle";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationStore } from "@/stores/notification.store";

export const MoreMenu = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const { handleSwitchAppearance, getThemeIcon, getThemeText } =
    useThemeToggle();

  const handleLogOut = async () => {
    await apiLogOut();
    logout();
    await navigate("/", { replace: true });
  };

  const handleSaved = async () => {
    await navigate("/profile/me", {
      state: { activeTab: "saved" },
    });
  };

  const ThemeIcon = getThemeIcon();
  const hasNotifications = unreadCount > 0;

  return (
    <li>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex flex-col items-center text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 outline-none">
          <div className="relative">
            <Menu className="h-6 w-6 mb-0.5" />
            {/* Notification Badge on the Menu Trigger */}
            {hasNotifications && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
            )}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
          {/* Notifications Item */}
          <DropdownMenuItem
            onClick={() => navigate("/notifications")}
            className="flex justify-between items-center"
          >
            <div className="flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              <span>Notifications</span>
            </div>
            {hasNotifications && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <RequireRole allowed={["ADMIN", "MODERATOR"]}>
            <DropdownMenuItem onClick={() => navigate("/mod/dashboard")}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Moderation</span>
            </DropdownMenuItem>
          </RequireRole>

          <DropdownMenuItem onClick={() => navigate("/profile/me")}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleSwitchAppearance}>
            <ThemeIcon className="mr-2 h-4 w-4" />
            <span>{getThemeText()}</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleSaved}>
            <Bookmark className="mr-2 h-4 w-4" />
            <span>Saved</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleLogOut} variant="destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
};
