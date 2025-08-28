import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TagFilterProps {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearAll: () => void;
}

const popularTags = [
  { name: "Mathematics", category: "math" },
  { name: "Physics", category: "physics" },
  { name: "Programming", category: "programming" },
  { name: "Chemistry", category: "chemistry" },
  { name: "Biology", category: "biology" },
  { name: "Calculus", category: "math" },
  { name: "JavaScript", category: "programming" },
  { name: "Quantum Mechanics", category: "physics" },
];

export const TagFilter = ({
  selectedTags,
  onTagToggle,
  onClearAll,
}: TagFilterProps) => {
  const getTagClassName = (category: string) => {
    return `tag-${category}`;
  };

  return (
    <div className="space-y-4">
      {selectedTags.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onTagToggle(tag)}
            >
              {tag}
              <X className="w-3 h-3" />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Popular Tags</h3>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => {
            const isSelected = selectedTags.includes(tag.name);
            return (
              <Badge
                key={tag.name}
                variant={isSelected ? "default" : "secondary"}
                className={`cursor-pointer ${
                  !isSelected ? getTagClassName(tag.category) : ""
                } border`}
                onClick={() => onTagToggle(tag.name)}
              >
                {tag.name}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
};
