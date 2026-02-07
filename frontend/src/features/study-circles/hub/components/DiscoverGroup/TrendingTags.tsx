import { TrendingUp } from "lucide-react";

const TRENDING_TAGS = [
  "ComputerScience",
  "Mathematics",
  "Design",
  "Physics",
  "Biology",
  "Engineering",
  "Literature",
  "Economics",
];

interface TrendingTagsProps {
  onTagClick: (tag: string) => void;
}

export function TrendingTags({ onTagClick }: TrendingTagsProps) {
  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <TrendingUp className="w-3.5 h-3.5" />
        <span className="font-medium">Trending topics</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {TRENDING_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => onTagClick(tag)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
}
