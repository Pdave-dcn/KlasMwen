import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { Check, Monitor, Moon, Sun } from "lucide-react";

export const THEME_OPTIONS = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

interface ThemeMenuItemProps {
  value: (typeof THEME_OPTIONS)[number]["value"];
  icon: (typeof THEME_OPTIONS)[number]["icon"];
  label: string;
  currentTheme: string;
  onSelect: (theme: "light" | "dark" | "system") => void;
}

export const ThemeMenuItem = ({
  value,
  icon: Icon,
  label,
  currentTheme,
  onSelect,
}: ThemeMenuItemProps) => (
  <DropdownMenuItem
    onClick={() => onSelect(value)}
    className="flex items-center justify-between"
  >
    <div className="flex items-center">
      <Icon className="mr-2 h-4 w-4" />
      <span>{label}</span>
    </div>
    {currentTheme === value && <Check className="h-4 w-4" />}
  </DropdownMenuItem>
);
