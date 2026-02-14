import { useNavigate, useLocation, NavLink } from "react-router-dom";

import { Shield } from "lucide-react";

import { logOut as apiLogOut } from "@/api/auth.api";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

import RequireRole from "../../RequireRole";

import { NAV_ITEMS } from "./constants";
import { Logo } from "./Logo";
import { MoreMenu } from "./MoreMenu";
import { NavItem } from "./NavItem";

interface SidebarProps {
  onCreateClick: () => void;
}

const Sidebar = ({ onCreateClick }: SidebarProps) => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const isModDashboard = location.pathname.startsWith("/mod/dashboard");
  const isCirclesPage = location.pathname.startsWith("/circles");

  const isHidden = isModDashboard || isCirclesPage;

  const handleLogOut = async () => {
    await apiLogOut();
    logout();
    await navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col md:justify-between md:px-6 md:py-20 lg:py-2.5">
      <Logo isHidden={isHidden} />

      <div className="flex flex-col gap-10">
        {NAV_ITEMS.map((item) => {
          let isActive = false;
          if (!item.action && item.url) {
            if (item.url === "/home") {
              isActive = location.pathname === "/home";
            } else if (item.url.startsWith("/circles")) {
              isActive = location.pathname.startsWith("/circles");
            } else {
              isActive = location.pathname.startsWith(item.url);
            }
          }

          return (
            <NavItem
              key={item.title}
              item={item}
              isActive={isActive}
              isLabelHidden={isHidden}
              onCreateClick={onCreateClick}
            />
          );
        })}

        <RequireRole allowed={["ADMIN", "MODERATOR"]}>
          <NavLink
            to="/mod/dashboard"
            className={({ isActive }) =>
              cn(
                "flex gap-1.5 items-center transition-colors",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <Shield className="h-7 w-7" />
            <span className={cn(isHidden ? "hidden" : "hidden lg:block")}>
              Moderation
            </span>
          </NavLink>
        </RequireRole>
      </div>

      <MoreMenu
        theme={theme}
        isLabelHidden={isHidden}
        onThemeChange={setTheme}
        onSavedClick={() =>
          navigate("/profile/me", { state: { activeTab: "saved" } })
        }
        onSettingsClick={() => navigate("/settings")}
        onLogOut={handleLogOut}
      />
    </div>
  );
};

export default Sidebar;
