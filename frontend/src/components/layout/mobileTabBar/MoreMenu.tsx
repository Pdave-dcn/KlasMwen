import { useNavigate } from "react-router-dom";

import { Menu, Shield, User, Settings, Bookmark, LogOut } from "lucide-react";

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

export const MoreMenu = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
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

  return (
    <li>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex flex-col items-center text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1">
          <Menu className="h-6 w-6 mb-0.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
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
