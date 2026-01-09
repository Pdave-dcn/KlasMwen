import { Bell, Home, Plus, Search, User } from "lucide-react";

export const NAV_ITEMS = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Search", url: "/search", icon: Search },
  { title: "Create", action: true, icon: Plus },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Profile", url: "/profile/me", icon: User },
];
