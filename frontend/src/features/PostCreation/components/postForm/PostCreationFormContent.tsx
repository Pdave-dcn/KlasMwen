import type { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import type { usePostCreationMutation } from "@/queries/post.query";
import type { PostFormValues, PostType } from "@/zodSchemas/post.zod";
import type { Tag } from "@/zodSchemas/tag.zod";

import ContentField from "./ContentField";
import FileUploadField from "./FileUploadField";
import { TagsSelectorWrapper } from "./TagSelectorWrapper";
import TitleField from "./TitleField";

interface PostCreationFormContentProps {
  form: UseFormReturn<PostFormValues>;
  tags: Tag[];
  tagsLoading: boolean;
  tagsError: Error | null;
  createMutation: ReturnType<typeof usePostCreationMutation>;
  postType: PostType;
  resourceFile?: File;
  onSubmit: (data: PostFormValues) => void;
  onCancel: () => void;
}

export const PostCreationFormContent = ({
  form,
  tags,
  tagsLoading,
  tagsError,
  createMutation,
  postType,
  resourceFile,
  onSubmit,
  onCancel,
}: PostCreationFormContentProps) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;
  const isProcessing = isSubmitting || createMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <TitleField control={control} errors={errors} postType={postType} />

      {postType !== "RESOURCE" && (
        <ContentField setValue={setValue} watch={watch} errors={errors} />
      )}

      {postType === "RESOURCE" && (
        <FileUploadField
          register={register}
          errors={errors}
          resourceFile={resourceFile}
        />
      )}

      <TagsSelectorWrapper
        form={form}
        tags={tags}
        tagsLoading={tagsLoading}
        tagsError={tagsError}
      />

      <input type="hidden" value={postType ?? ""} {...register("type")} />

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isProcessing}>
          {isProcessing
            ? "Publishing..."
            : `Publish ${postType?.toLowerCase()}`}
        </Button>
      </div>
    </form>
  );
};
