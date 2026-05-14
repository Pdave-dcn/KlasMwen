import { TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePopularTagsQuery } from "@/queries/tag.query";
import type { PopularTag } from "@/zodSchemas/tag.zod";

interface TrendingTagsProps {
  selectedTags: number[];
  onTagClick: (tag: PopularTag) => void;
}

export const TrendingTags = ({
  selectedTags,
  onTagClick,
}: TrendingTagsProps) => {
  const { data: popularTagsData, isLoading } = usePopularTagsQuery();

  if (isLoading) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3">
        <Skeleton className="h-4 w-24" />
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton
              key={`skeleton-tag-${i + 1}`}
              className="h-8 w-20 rounded-full"
            />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <TrendingUp className="w-3.5 h-3.5" />
        <span className="font-medium">Trending topics</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {popularTagsData?.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          return (
            <Button
              key={tag.id}
              onClick={() => onTagClick(tag)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                "bg-card border border-border text-muted-foreground",
                "hover:bg-accent hover:text-accent-foreground hover:border-accent",
                isSelected &&
                  "text-primary border-primary/40 bg-primary/5 hover:bg-primary/10",
              )}
            >
              #{tag.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
