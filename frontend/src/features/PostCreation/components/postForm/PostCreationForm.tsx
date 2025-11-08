import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePostCreationMutation } from "@/queries/usePosts.tsx";
import { useTagQuery } from "@/queries/useTag";
import {
  ResourcePostCreationSchema,
  TextPostCreationSchema,
  type PostFormValues,
  type PostType,
  type ResourcePostData,
} from "@/zodSchemas/post.zod";

import { buildResourceFormData, buildTextPostData } from "../../helpers";

import { PostCreationDialogHeader } from "./PostCreationDialogHeader";
import { PostCreationFormContent } from "./PostCreationFormContent";

interface PostCreationFormProps {
  open: boolean;
  onClose: () => void;
  postType: PostType | null;
}

const PostCreationForm = ({
  open,
  onClose,
  postType,
}: PostCreationFormProps) => {
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const schema =
    postType !== "RESOURCE"
      ? TextPostCreationSchema
      : ResourcePostCreationSchema;

  const form = useForm<PostFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tagIds: [],
      title: "",
      content: "",
      resource: undefined,
      type: postType ?? undefined,
    },
  });

  const { reset, watch } = form;

  useEffect(() => {
    if (postType) {
      if (postType === "RESOURCE") {
        reset({
          tagIds: [],
          title: "",
          resource: undefined as unknown as FileList,
          type: "RESOURCE",
        } as unknown as PostFormValues);
      } else {
        reset({
          tagIds: [],
          title: "",
          content: "",
          type: postType,
        } as unknown as PostFormValues);
      }
    }
  }, [postType, reset]);

  const resourceFileList = watch("resource") as unknown as FileList | undefined;
  const resourceFile = resourceFileList?.[0];

  const {
    data: tags,
    isLoading: tagsLoading,
    error: tagsError,
  } = useTagQuery();

  const mutation = usePostCreationMutation();

  const resetForm = () => {
    reset();
    setSelectedTagIds([]);
  };

  const onSubmit = (data: PostFormValues) => {
    if (postType === "RESOURCE") {
      const formData = buildResourceFormData(
        data,
        selectedTagIds,
        resourceFile
      );
      mutation.mutate(formData as unknown as ResourcePostData);
    } else {
      const textData = buildTextPostData(data, selectedTagIds);
      mutation.mutate(textData);
    }

    resetForm();
    onClose();
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!postType) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <PostCreationDialogHeader postType={postType} />

        <PostCreationFormContent
          form={form}
          tags={tags ?? []}
          tagsLoading={tagsLoading}
          tagsError={tagsError}
          createMutation={mutation}
          postType={postType}
          resourceFile={resourceFile}
          onSubmit={onSubmit}
          onCancel={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PostCreationForm;
