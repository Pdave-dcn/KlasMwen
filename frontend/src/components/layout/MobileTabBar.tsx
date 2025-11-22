import { NavLink, useNavigate } from "react-router-dom";

import clsx from "clsx";
import {
  Home,
  Plus,
  Search,
  Settings,
  User,
  Menu,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Bookmark,
  Bell,
  Shield,
} from "lucide-react";

import { logOut as apiLogOut } from "@/api/auth.api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth.store";

import RequireRole from "../RequireRole";

const navItems = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Search", url: "/search", icon: Search },
  { title: "Create", action: true, icon: Plus },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

const MobileTabBar = ({ onCreateClick }: { onCreateClick: () => void }) => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleSwitchAppearance = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

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

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return Moon;
      case "dark":
        return Monitor;
      case "system":
        return Sun;
      default:
        return Sun;
    }
  };

  const getThemeText = () => {
    switch (theme) {
      case "light":
        return "Dark Mode";
      case "dark":
        return "System";
      case "system":
        return "Light Mode";
      default:
        return "Light Mode";
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-sm md:hidden">
      <ul className="flex justify-around py-2">
        {navItems.map((item) =>
          item.action ? (
            <button
              key={item.title}
              onClick={() => onCreateClick()}
              className={clsx(
                "flex gap-1.5 items-center text-muted-foreground"
              )}
            >
              <item.icon className="h-6 w-6 mb-0.5" />
            </button>
          ) : (
            <li key={item.title}>
              <NavLink
                to={item.url as string}
                className={({ isActive }) =>
                  clsx(
                    "flex flex-col items-center text-xs transition-colors px-2 py-1",
                    isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={clsx(
                        "h-6 w-6 mb-0.5",
                        isActive ? "stroke-primary" : "stroke-muted-foreground"
                      )}
                    />
                  </>
                )}
              </NavLink>
            </li>
          )
        )}

        {/* More Dropdown */}
        <li>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex flex-col items-center text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1">
              <Menu className="h-6 w-6 mb-0.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
              <RequireRole allowed={["ADMIN", "MODERATOR", "GUEST"]}>
                <DropdownMenuItem onClick={() => navigate("/mod/dashboard")}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Moderation</span>
                </DropdownMenuItem>
              </RequireRole>

              {/* Profile */}
              <DropdownMenuItem onClick={() => navigate("/profile/me")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Settings */}
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Theme Switcher */}
              <DropdownMenuItem onClick={handleSwitchAppearance}>
                {(() => {
                  const ThemeIcon = getThemeIcon();
                  return <ThemeIcon className="mr-2 h-4 w-4" />;
                })()}
                <span>{getThemeText()}</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleSaved}>
                <Bookmark className="mr-2 h-4 w-4" />
                <span>Saved</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      </ul>
    </nav>
  );
};

export default MobileTabBar;
