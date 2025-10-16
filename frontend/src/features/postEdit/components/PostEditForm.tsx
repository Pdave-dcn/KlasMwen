/* eslint-disable complexity */
import { useEffect } from "react";

import { useForm } from "react-hook-form";

import { Label } from "@radix-ui/react-label";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import TagsSelector from "@/features/PostCreation/components/postForm/TagSelector";
import {
  usePostEditQuery,
  usePostUpdateMutation,
  type UpdatePostData,
} from "@/queries/usePosts";
import { useTagQuery } from "@/queries/useTag";
import { usePostEditStore } from "@/stores/postEdit.store";

interface PostEditFormProps {
  open: boolean;
  onClose: () => void;
}

type TextPostData = {
  title: string;
  tagIds: number[];
  type: "NOTE" | "QUESTION";
  content: string;
};

type ResourcePostData = {
  title: string;
  tagIds: number[];
  type: "RESOURCE";
  fileName: string;
  fileSize: number;
};

const PostEditForm = ({ open, onClose }: PostEditFormProps) => {
  const { postToEdit } = usePostEditStore();
  const { data: post, isLoading: postLoading } = usePostEditQuery(
    postToEdit?.id
  );

  const {
    data: tags,
    isLoading: tagsLoading,
    error: tagsError,
  } = useTagQuery();

  const updatePostMutation = usePostUpdateMutation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePostData>({
    defaultValues: {
      title: "",
      content: "",
      tagIds: [],
      type: undefined,
    },
  });

  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        content: post.content ?? "",
        tagIds: post.tags.map((tag) => tag.id),
        type: post.type,
      });
    }
  }, [post, reset]);

  const selectedTagIds = watch("tagIds");

  const hasFile = post?.hasFile ?? false;
  const isTextPost = !hasFile;
  const isResourcePost = hasFile;

  const handleAddTag = (tagId: number) => {
    const currentTags = selectedTagIds ?? [];
    if (!currentTags.includes(tagId) && currentTags.length < 10) {
      setValue("tagIds", [...currentTags, tagId], { shouldValidate: true });
    }
  };

  const handleRemoveTag = (tagId: number) => {
    setValue("tagIds", selectedTagIds?.filter((id) => id !== tagId) ?? [], {
      shouldValidate: true,
    });
  };

  const onSubmit = (data: UpdatePostData) => {
    if (!post?.id) return;

    const updateData = {
      title: data.title,
      type: data.type,
      tagIds: data.tagIds ?? [],
    };

    if (isTextPost) {
      (updateData as TextPostData).content = (data as TextPostData).content;
    }

    if (isResourcePost && post.fileName) {
      (updateData as ResourcePostData).fileName = post.fileName;
    }

    updatePostMutation.mutate(
      { postId: post.id, data: updateData as UpdatePostData },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (postLoading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <Spinner />
            <p>Loading post data...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Post</DialogTitle>
          <DialogDescription>
            {isResourcePost
              ? "Update the post title and tags below."
              : "Update the post content and tags below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Title
            </Label>
            <Input
              id="title"
              type="text"
              {...register("title", {
                required: "Title is required",
                minLength: {
                  value: 5,
                  message: "Title must be at least 5 characters",
                },
                maxLength: {
                  value: 100,
                  message: "Title must not exceed 100 characters",
                },
              })}
              placeholder="Enter post title"
            />
            {errors.title && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-sm">
                  {errors.title.message}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Content Field */}
          {isTextPost && (
            <div className="space-y-2">
              <Label htmlFor="content" className="text-base font-semibold">
                Content
              </Label>
              <Textarea
                id="content"
                {...register("content", {
                  required: "Content is required",
                  minLength: {
                    value: 10,
                    message: "Content must be at least 10 characters",
                  },
                  maxLength: {
                    value: 10000,
                    message: "Content must not exceed 10000 characters",
                  },
                })}
                rows={10}
                className="text-base resize-none min-h-[150px]"
                placeholder="Write your post content here..."
              />
              {errors.content && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-sm">
                    {errors.content.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* File Info Display */}
          {isResourcePost && post.fileName && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">Attached File</Label>
              <div className="p-3 rounded-md border">
                <p className="text-sm font-medium">{post.fileName}</p>
                {post.fileSize && (
                  <p className="text-xs mt-1">
                    Size: {(post.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
              <p className="text-xs">
                File cannot be changed when editing a post
              </p>
            </div>
          )}

          <input type="hidden" value={post.type} {...register("type")} />

          {/* Tags Selector */}
          <TagsSelector
            tags={tags}
            tagsLoading={tagsLoading}
            tagsError={tagsError}
            selectedTagIds={selectedTagIds ?? []}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            errors={errors}
          />

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting || updatePostMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || updatePostMutation.isPending}
            >
              {isSubmitting || updatePostMutation.isPending
                ? "Updating..."
                : "Update"}
            </Button>
          </div>

          {/* Error Message */}
          {updatePostMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to update post. Please try again.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PostEditForm;
