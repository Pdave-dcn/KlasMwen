import { useNavigate } from "react-router-dom";

import { Sparkles, ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useRecommendedGroupsQuery } from "@/queries/chat.query";

import { SuggestedGroupCard } from "./SuggestedGroupCard";

export function SuggestedGroupsSection() {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useRecommendedGroupsQuery(5);
  const groups = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) {
    return (
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">
            Suggested for You
          </h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (isError || !groups || groups.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">
            Suggested for You
          </h3>
        </div>
        <button
          onClick={() => navigate("/chat/groups/discover")}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          Discover more
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2">
        {groups.map((group) => (
          <SuggestedGroupCard key={group.id} group={group} />
        ))}
      </div>
    </section>
  );
}
