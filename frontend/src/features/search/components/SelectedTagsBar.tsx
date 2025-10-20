import { Hash, X } from "lucide-react";

import type { PopularTag } from "@/zodSchemas/tag.zod";

interface SelectedTagsBarProps {
  selectedTags: string[];
  mostPopularTags: PopularTag[];
  onTagToggle: (tagId: string) => void;
  onClearAll: () => void;
}

const SelectedTagsBar = ({
  selectedTags,
  mostPopularTags,
  onTagToggle,
  onClearAll,
}: SelectedTagsBarProps) => {
  if (selectedTags.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">
        Filtering by:
      </span>
      {selectedTags.map((tagId) => {
        const tag = mostPopularTags?.find((t) => t.id === parseInt(tagId, 10));
        return tag ? (
          <button
            key={tagId}
            onClick={() => onTagToggle(tagId)}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Hash className="h-3 w-3" />
            {tag.name}
            <X className="h-3 w-3" />
          </button>
        ) : null;
      })}
      <button
        onClick={onClearAll}
        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Clear all
      </button>
    </div>
  );
};

export default SelectedTagsBar;
