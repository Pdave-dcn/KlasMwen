import { Hash, TrendingUp } from "lucide-react";

import type { PopularTag } from "@/zodSchemas/tag.zod";

interface TrendingTagsSectionProps {
  tags: PopularTag[];
  selectedTags: string[];
  onTagToggle: (tagId: string) => void;
}

const TrendingTagsSection = ({
  tags,
  selectedTags,
  onTagToggle,
}: TrendingTagsSectionProps) => (
  <div className="mb-8 rounded-lg border bg-card p-6">
    <div className="mb-4 flex items-center gap-2">
      <TrendingUp className="h-5 w-5" />
      <h2 className="text-lg font-semibold">Filter by Tags</h2>
    </div>
    <div className="flex flex-wrap gap-2">
      {tags?.map((tag) => {
        const isSelected = selectedTags.includes(String(tag.id));
        return (
          <button
            key={tag.id}
            onClick={() => onTagToggle(String(tag.id))}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              isSelected
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <Hash className="h-4 w-4" />
            {tag.name}
          </button>
        );
      })}
    </div>
  </div>
);

export default TrendingTagsSection;
