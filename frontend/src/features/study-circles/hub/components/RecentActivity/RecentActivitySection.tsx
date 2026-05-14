import { useNavigate } from "react-router-dom";

import { Clock, ChevronRight } from "lucide-react";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentActivityCirclesQuery } from "@/queries/circle";

import { useCirclesPresenceCount } from "../../hooks/useCirclesPresenceCount";

import { RecentCircleCard } from "./RecentCircleCard";

export const RecentActivitySection = () => {
  const navigate = useNavigate();

  const { data: groups, isLoading, isError } = useRecentActivityCirclesQuery();

  useCirclesPresenceCount(groups ? groups.map((group) => group.id) : []);

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">
            Continue Studying
          </h3>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="w-64 h-28 rounded-xl shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (isError || !groups || groups.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">
            Continue Studying
          </h3>
        </div>
        <button
          onClick={() => navigate("/circles/mine")}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          View all
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4">
          {groups.map((circle) => (
            <RecentCircleCard
              key={circle.id}
              circle={circle}
              onClick={() => navigate(`/circles/mine?circle=${circle.id}`)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};
