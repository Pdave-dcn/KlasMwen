import { MessageCircle, Users, Bell, AlertCircle } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useQuickStatsQuery } from "@/queries/chat.query";

export const QuickStatsBar = () => {
  const { data, isLoading, isError } = useQuickStatsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-6 px-4 py-3 rounded-xl bg-muted/50 border border-border/50">
        {[...Array(3)].map((_, index) => (
          <div key={`item-${index + 1}`} className="flex items-center gap-2">
            <Skeleton className="w-7 h-7 rounded-md" />
            <div className="flex items-baseline gap-1">
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-3 w-12 hidden sm:block" />
            </div>
            {index < 2 && <div className="w-px h-6 bg-border ml-4" />}
          </div>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20">
        <div className="p-1.5 rounded-md bg-destructive/10">
          <AlertCircle className="w-4 h-4 text-destructive" />
        </div>
        <span className="text-sm font-medium text-destructive">
          Unable to load stats
        </span>
      </div>
    );
  }

  const { activeGroups, unreadMessages, studyPartners } = data;

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
            className={cn(
              "p-1.5 rounded-md transition-colors",
              stat.highlight ? "bg-primary/10" : "bg-background",
            )}
          >
            <stat.icon
              className={cn(
                "w-4 h-4 transition-colors",
                stat.highlight ? "text-primary" : "text-muted-foreground",
              )}
            />
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "text-lg font-semibold transition-colors",
                stat.highlight ? "text-primary" : "text-foreground",
              )}
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
