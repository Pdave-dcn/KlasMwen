import type { UseFormReturn } from "react-hook-form";

import TagsSelector from "@/features/PostCreation/components/postForm/TagSelector";
import type { UpdatePostData } from "@/queries/usePosts";
import type { Tag } from "@/zodSchemas/tag.zod";

interface TagsSelectorWrapperProps {
  form: UseFormReturn<UpdatePostData>;
  tags: Tag[];
  tagsLoading: boolean;
  tagsError: Error | null;
}

export const TagsSelectorWrapper = ({
  form,
  tags,
  tagsLoading,
  tagsError,
}: TagsSelectorWrapperProps) => {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const selectedTagIds = watch("tagIds") ?? [];

  const handleAddTag = (tagId: number) => {
    if (!selectedTagIds.includes(tagId) && selectedTagIds.length < 10) {
      setValue("tagIds", [...selectedTagIds, tagId], { shouldValidate: true });
    }
  };

  const handleRemoveTag = (tagId: number) => {
    setValue(
      "tagIds",
      selectedTagIds.filter((id) => id !== tagId),
      {
        shouldValidate: true,
      }
    );
  };

  return (
    <TagsSelector
      tags={tags}
      tagsLoading={tagsLoading}
      tagsError={tagsError}
      selectedTagIds={selectedTagIds}
      onAddTag={handleAddTag}
      onRemoveTag={handleRemoveTag}
      errors={errors}
    />
  );
};
