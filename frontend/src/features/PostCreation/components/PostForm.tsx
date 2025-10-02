/* eslint-disable complexity */
import { useState } from "react";

import { useForm, type FieldErrors } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCw, Upload } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePostMutation } from "@/queries/usePosts";
import { useTagQuery } from "@/queries/useTag";
import {
  ResourcePostCreationSchema,
  TextPostCreationSchema,
  type PostFormValues,
  type PostType,
  type ResourcePostData,
  type TextPostData,
} from "@/zodSchemas/post.zod";

import { getFormDescription, getFormTitle } from "../helpers";

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

  const mutation = usePostMutation();

  const onSubmit = (data: PostFormValues) => {
    if (postType === "RESOURCE") {
      const resourceData = new FormData();
      resourceData.append("title", data.title);
      resourceData.append("type", data.type);
      resourceData.append("tagIds", JSON.stringify(selectedTagIds));

      if (resourceFile) resourceData.append("resource", resourceFile);

      mutation.mutate(resourceData as unknown as ResourcePostData);
    } else {
      const TextData = {
        ...data,
        tagIds: selectedTagIds,
      };

      mutation.mutate(TextData as unknown as TextPostData);
    }

    reset();
    setSelectedTagIds([]);
    onClose();
  };

  const handleClose = () => {
    onClose();
    reset();
    setSelectedTagIds([]);
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
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Title *
            </Label>
            <Input
              id="title"
              type="text"
              {...register("title")}
              placeholder={`Enter your ${postType?.toLowerCase()} title...`}
              className="text-base"
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
          {postType !== "RESOURCE" && (
            <div className="space-y-2">
              <Label htmlFor="content" className="text-base font-semibold">
                Content *
              </Label>
              <Textarea
                id="content"
                {...register("content")}
                placeholder={`Write your ${postType?.toLowerCase()} content here...`}
                className="text-base resize-none min-h-[150px]"
              />
              {(errors as FieldErrors<TextPostData>).content && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-sm">
                    {(errors as FieldErrors<TextPostData>).content?.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* File Upload */}
          {postType === "RESOURCE" && (
            <div className="space-y-2">
              <Label htmlFor="resource" className="text-base font-semibold">
                File *
              </Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  id="resource"
                  type="file"
                  {...register("resource")}
                  className="hidden"
                />
                <Label
                  htmlFor="resource"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  {resourceFile ? (
                    <div>
                      <p className="text-base font-medium">
                        {resourceFile.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(resourceFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-base font-medium mb-2">
                        Click to upload a file
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Or drag and drop your file here
                      </p>
                    </div>
                  )}
                </Label>
              </div>
              {(errors as FieldErrors<ResourcePostData>).resource && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-sm">
                    {
                      (errors as FieldErrors<ResourcePostData>).resource
                        ?.message
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Tags Field */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-base font-semibold">
              Tags{" "}
              {selectedTagIds.length > 0 && `(${selectedTagIds.length}/10)`}
            </Label>

            {/* Tag Chips */}
            <div className="flex flex-wrap gap-2">
              {tagsLoading && !tagsError && (
                <RotateCw className="animate-spin" />
              )}
              {!tagsLoading && tagsError && (
                <span className="text-muted-foreground">
                  Error loading tags
                </span>
              )}
              {tags?.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      isSelected ? removeTag(tag.id) : addTag(tag.id)
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

          {/* Post type */}
          <input type="hidden" value={postType ?? ""} {...register("type")} />

          {/* Submit Button */}
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
