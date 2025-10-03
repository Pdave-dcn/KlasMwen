import type { FieldErrors } from "react-hook-form";

import { Label } from "@radix-ui/react-label";
import { RotateCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PostFormValues } from "@/zodSchemas/post.zod";

interface TagsSelectorProps {
  tags?: Array<{ id: number; name: string }>;
  tagsLoading: boolean;
  tagsError: Error | null;
  selectedTagIds: number[];
  onAddTag: (tagId: number) => void;
  onRemoveTag: (tagId: number) => void;
  errors: FieldErrors<PostFormValues>;
}

const TagsSelector = ({
  tags,
  tagsLoading,
  tagsError,
  selectedTagIds,
  onAddTag,
  onRemoveTag,
  errors,
}: TagsSelectorProps) => (
  <div className="space-y-2">
    <Label htmlFor="tags" className="text-base font-semibold">
      Tags {selectedTagIds.length > 0 && `(${selectedTagIds.length}/10)`}
    </Label>

    <div className="flex flex-wrap gap-2">
      {tagsLoading && !tagsError && <RotateCw className="animate-spin" />}
      {!tagsLoading && tagsError && (
        <span className="text-muted-foreground">Error loading tags</span>
      )}
      {tags?.map((tag) => {
        const isSelected = selectedTagIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() =>
              isSelected ? onRemoveTag(tag.id) : onAddTag(tag.id)
            }
            className={`px-3 py-1 rounded-full border transition-colors ${
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-foreground hover:bg-muted/70"
            }`}
          >
            {tag.name}
          </button>
        );
      })}
    </div>

    {errors.tagIds && (
      <Alert variant="destructive" className="py-2">
        <AlertDescription className="text-sm">
          {errors.tagIds.message}
        </AlertDescription>
      </Alert>
    )}
  </div>
);

export default TagsSelector;
