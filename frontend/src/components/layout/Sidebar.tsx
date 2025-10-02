import { NavLink, useNavigate } from "react-router-dom";

import clsx from "clsx";
import {
  Home,
  Search,
  Settings,
  User,
  Plus,
  Menu,
  BookOpen,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Bookmark,
  Check,
} from "lucide-react";

import { logOut as apiLogOut } from "@/api/auth.api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth.store";

const items = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Search", url: "/search", icon: Search },
  { title: "Create", action: true, icon: Plus },
  { title: "Profile", url: "/profile/me", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
];

interface SidebarProps {
  onCreateClick: () => void;
}

const Sidebar = ({ onCreateClick }: SidebarProps) => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleLogOut = async () => {
    await apiLogOut();
    logout();
    await navigate("/", { replace: true });
  };

  const handleSaved = async () => {
    await navigate("#");
  };

  const getThemeIcon = (themeOption: "light" | "dark" | "system") => {
    switch (themeOption) {
      case "light":
        return Sun;
      case "dark":
        return Moon;
      case "system":
        return Monitor;
      default:
        return Monitor;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:justify-between md:px-6 md:py-20 lg:py-2.5">
      {/* Logo */}
      <div className="flex items-center gap-2 ">
        <div className="">
          <BookOpen className="hidden w-7 h-7 md:block lg:hidden" />
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold bg-gradient-primary">KlasMwen</h1>
            <p className="text-xs text-muted-foreground">Learn. Share. Grow.</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-10">
        {items.map((item) =>
          item.action ? (
            <button
              key={item.title}
              onClick={() => onCreateClick()}
              className={clsx(
                "flex gap-1.5 cursor-pointer items-center text-muted-foreground hover:text-foreground transition-colors"
              )}
            >
              <item.icon className="h-7 w-7" />
              <span className="hidden lg:block">{item.title}</span>
            </button>
          ) : (
            <NavLink
              key={item.title}
              to={item.url as string}
              className={({ isActive }) =>
                clsx(
                  `flex gap-1.5 items-center transition-colors`,
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <item.icon className="h-7 w-7" />
              <span className="hidden lg:block">{item.title}</span>
            </NavLink>
          )
        )}
      </div>

      {/* More Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex gap-1.5 items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <Menu className="h-7 w-7" />
          <span className="hidden lg:block">More</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {/* Theme Submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {(() => {
                const ThemeIcon = getThemeIcon(theme);
                return <ThemeIcon className="mr-2 h-4 w-4" />;
              })()}
              <span>Appearance</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                </div>
                {theme === "light" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark</span>
                </div>
                {theme === "dark" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>System</span>
                </div>
                {theme === "system" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

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
    </div>
  );
};

export default Sidebar;
