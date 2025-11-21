import type { UseFormReturn } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type {
  UpdatePostData,
  usePostUpdateMutation,
} from "@/queries/post.query";
import type { PostEdit } from "@/zodSchemas/post.zod";
import type { Tag } from "@/zodSchemas/tag.zod";

import { ContentField } from "./ContentField";
import { FileInfoDisplay } from "./FileInfoDisplay";
import { TagsSelectorWrapper } from "./TagSelectorWrapper";
import { TitleField } from "./TitleField";

interface PostEditFormContentProps {
  form: UseFormReturn<UpdatePostData>;
  post: PostEdit;
  tags: Tag[];
  tagsLoading: boolean;
  tagsError: Error | null;
  isResourcePost: boolean;
  updateMutation: ReturnType<typeof usePostUpdateMutation>;
  onSubmit: (data: UpdatePostData) => void;
  onCancel: () => void;
}

export const PostEditFormContent = ({
  form,
  post,
  tags,
  tagsLoading,
  tagsError,
  isResourcePost,
  updateMutation,
  onSubmit,
  onCancel,
}: PostEditFormContentProps) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const isProcessing = isSubmitting || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4">
      <TitleField control={control} errors={errors} />

      {!isResourcePost && <ContentField errors={errors} control={control} />}

      {isResourcePost && <FileInfoDisplay post={post} />}

      <input type="hidden" value={post.type} {...register("type")} />

      <TagsSelectorWrapper
        form={form}
        tags={tags}
        tagsLoading={tagsLoading}
        tagsError={tagsError}
      />

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isProcessing}>
          {isProcessing ? "Updating..." : "Update"}
        </Button>
      </div>

      {updateMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to update post. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
};
