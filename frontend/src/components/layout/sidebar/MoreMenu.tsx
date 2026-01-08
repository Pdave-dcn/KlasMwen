import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { Bookmark, LogOut, Menu, Monitor, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

import { THEME_OPTIONS, ThemeMenuItem } from "./ThemeMenuItem";

interface MoreMenuProps {
  theme: string;
  isLabelHidden: boolean;
  onThemeChange: (theme: "light" | "dark" | "system") => void;
  onSavedClick: () => void;
  onSettingsClick: () => void;
  onLogOut: () => void;
}

export const MoreMenu = ({
  theme,
  isLabelHidden,
  onThemeChange,
  onSavedClick,
  onSettingsClick,
  onLogOut,
}: MoreMenuProps) => {
  const CurrentThemeIcon =
    THEME_OPTIONS.find((opt) => opt.value === theme)?.icon ?? Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex gap-1.5 items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        <Menu className="h-7 w-7" />
        <span className={cn(isLabelHidden ? "hidden" : "hidden lg:block")}>
          More
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <CurrentThemeIcon className="mr-2 h-4 w-4" />
            <span>Appearance</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {THEME_OPTIONS.map((option) => (
              <ThemeMenuItem
                key={option.value}
                value={option.value}
                icon={option.icon}
                label={option.label}
                currentTheme={theme}
                onSelect={onThemeChange}
              />
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem onClick={onSavedClick}>
          <Bookmark className="mr-2 h-4 w-4" />
          <span>Saved</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onSettingsClick}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onLogOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
