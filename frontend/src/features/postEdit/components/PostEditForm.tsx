import { useEffect } from "react";

import { useForm } from "react-hook-form";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  usePostEditQuery,
  usePostUpdateMutation,
  type UpdatePostData,
} from "@/queries/usePosts";
import { useTagQuery } from "@/queries/useTag";
import { usePostEditStore } from "@/stores/postEdit.store";

import { PostEditDialogHeader } from "./PostEditDialogHeader";
import { PostEditFormContent } from "./PostEditFormContent";
import { PostEditLoadingState } from "./PostEditLoadingState";

interface PostEditFormProps {
  open: boolean;
  onClose: () => void;
}

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

  const form = useForm<UpdatePostData>({
    defaultValues: {
      title: "",
      content: "",
      tagIds: [],
      type: undefined,
    },
  });

  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        content: post.content ?? "",
        tagIds: post.tags.map((tag) => tag.id),
        type: post.type,
      });
    }
  }, [post, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = (data: UpdatePostData) => {
    if (!post?.id) return;

    updatePostMutation.mutate(
      { postId: post.id, data },
      {
        onSuccess: () => {
          form.reset();
          onClose();
        },
      }
    );
  };

  if (postLoading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl">
          <PostEditLoadingState />
        </DialogContent>
      </Dialog>
    );
  }

  if (!post) return null;

  const isResourcePost = post?.hasFile ?? false;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <PostEditDialogHeader isResourcePost={isResourcePost} />
        <PostEditFormContent
          form={form}
          post={post}
          tags={tags ?? []}
          tagsLoading={tagsLoading}
          tagsError={tagsError}
          isResourcePost={isResourcePost}
          updateMutation={updatePostMutation}
          onSubmit={onSubmit}
          onCancel={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PostEditForm;
