import { Sun, Moon, Monitor } from "lucide-react";

import { useTheme } from "@/hooks/use-theme";

export const useThemeToggle = () => {
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

  return {
    handleSwitchAppearance,
    getThemeIcon,
    getThemeText,
  };
};
