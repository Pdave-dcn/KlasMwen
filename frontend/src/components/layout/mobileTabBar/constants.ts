import { Home, Plus, Search, Bell, MessageCircle } from "lucide-react";

export const navItems = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Search", url: "/search", icon: Search },
  { title: "Study Circles", url: "/chat", icon: MessageCircle },
  { title: "Create", action: true, icon: Plus },
  { title: "Notifications", url: "/notifications", icon: Bell },
];
