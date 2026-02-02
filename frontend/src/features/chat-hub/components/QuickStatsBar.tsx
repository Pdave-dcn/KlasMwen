import { MessageCircle, Users, Bell } from "lucide-react";

interface QuickStatsBarProps {
  activeGroups: number;
  unreadMessages: number;
  studyPartners: number;
}

export const QuickStatsBar = ({
  activeGroups,
  unreadMessages,
  studyPartners,
}: QuickStatsBarProps) => {
  const stats = [
    { icon: MessageCircle, value: activeGroups, label: "Active Groups" },
    {
      icon: Bell,
      value: unreadMessages,
      label: "Unread",
      highlight: unreadMessages > 0,
    },
    { icon: Users, value: studyPartners, label: "Partners" },
  ];

  return (
    <div className="flex items-center justify-center gap-6 px-4 py-3 rounded-xl bg-muted/50 border border-border/50">
      {stats.map((stat, index) => (
        <div key={stat.label} className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-md ${stat.highlight ? "bg-primary/10" : "bg-background"}`}
          >
            <stat.icon
              className={`w-4 h-4 ${stat.highlight ? "text-primary" : "text-muted-foreground"}`}
            />
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-lg font-semibold ${stat.highlight ? "text-primary" : "text-foreground"}`}
            >
              {stat.value}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {stat.label}
            </span>
          </div>
          {index < stats.length - 1 && (
            <div className="w-px h-6 bg-border ml-4" />
          )}
        </div>
      ))}
    </div>
  );
};
