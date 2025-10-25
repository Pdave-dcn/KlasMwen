import { useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePostCreationMutation } from "@/queries/usePosts";
import { useTagQuery } from "@/queries/useTag";
import {
  ResourcePostCreationSchema,
  TextPostCreationSchema,
  type PostFormValues,
  type PostType,
  type ResourcePostData,
} from "@/zodSchemas/post.zod";

import {
  buildResourceFormData,
  buildTextPostData,
  getFormDescription,
  getFormTitle,
} from "../../helpers";

import ContentField from "./ContentField";
import FileUploadField from "./FileUploadField";
import TagsSelector from "./TagSelector";
import TitleField from "./TitleField";

interface PostFormProps {
  open: boolean;
  onClose: () => void;
  postType: PostType | null;
}

const PostForm = ({ open, onClose, postType }: PostFormProps) => {
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const schema =
    postType !== "RESOURCE"
      ? TextPostCreationSchema
      : ResourcePostCreationSchema;

  const { register, handleSubmit, formState, reset, setValue, watch } =
    useForm<PostFormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        tagIds: [],
      },
    });

  const resourceFileList = watch("resource") as unknown as FileList | undefined;
  const resourceFile = resourceFileList?.[0];

  const { errors } = formState;

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

  const addTag = (tagId: number) => {
    if (!selectedTagIds.includes(tagId) && selectedTagIds.length < 10) {
      const newTagIds = [...selectedTagIds, tagId];
      setSelectedTagIds(newTagIds);
      setValue("tagIds", newTagIds);
    }
  };

  const removeTag = (tagId: number) => {
    const newTagIds = selectedTagIds.filter((id) => id !== tagId);
    setSelectedTagIds(newTagIds);
    setValue("tagIds", newTagIds.length > 0 ? newTagIds : null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {getFormTitle(postType)}
          </DialogTitle>
          <DialogDescription>{getFormDescription(postType)}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <TitleField register={register} errors={errors} postType={postType} />

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

          <TagsSelector
            tags={tags}
            tagsLoading={tagsLoading}
            tagsError={tagsError}
            selectedTagIds={selectedTagIds}
            onAddTag={addTag}
            onRemoveTag={removeTag}
            errors={errors}
          />

          <input type="hidden" value={postType ?? ""} {...register("type")} />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Publishing..."
                : `Publish ${postType?.toLowerCase()}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PostForm;
