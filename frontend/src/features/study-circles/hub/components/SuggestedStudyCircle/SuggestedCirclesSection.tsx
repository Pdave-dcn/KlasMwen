import { useNavigate } from "react-router-dom";

import { Sparkles, ChevronRight, AlertCircle, Search } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecommendedCirclesQuery } from "@/queries/circle";

import { useCirclesPresenceCount } from "../../hooks/useCirclesPresenceCount";

import { SuggestedCircleCard } from "./SuggestedCircleCard";

export function SuggestedCirclesSection() {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useRecommendedCirclesQuery(5);
  const circles = data?.pages.flatMap((page) => page.data) ?? [];

  useCirclesPresenceCount(circles.map((circle) => circle.id));

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

  if (isError) {
    return (
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">
            Suggested for You
          </h3>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load suggestions</AlertTitle>
          <AlertDescription>
            We couldn't fetch study circles suggestions at this time. Please try
            again later.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  if (!circles || circles.length === 0) {
    return (
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">
            Suggested for You
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg border border-dashed bg-muted/30">
          <Search className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground font-medium mb-1">
            No suggestions available
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Try discovering study circles to get started
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/circles/discover")}
            className="gap-1"
          >
            Discover study circles
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </section>
    );
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
          onClick={() => navigate("/circles/discover")}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          Discover more
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2">
        {circles.map((circle) => (
          <SuggestedCircleCard key={circle.id} circle={circle} />
        ))}
      </div>
    </section>
  );
}
