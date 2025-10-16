import { useEffect, useRef } from "react";

import { useForm } from "react-hook-form";

import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCommentMutation } from "@/queries/useComment";

interface CommentFormProps {
  postId: string;
  parentId?: number;
  isReply?: boolean;
  author?: string;
  onSubmitStart?: () => void;
}

interface CommentFormData {
  content: string;
  parentId?: number;
}

const MAX_LENGTH = 780;

const CommentForm = ({
  postId,
  parentId,
  isReply = false,
  author,
  onSubmitStart,
}: CommentFormProps) => {
  const { register, handleSubmit, watch, reset } = useForm<CommentFormData>({
    defaultValues: { content: "" },
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const content = watch("content") ?? "";

  const commentMutation = useCommentMutation();

  const onSubmit = (data: CommentFormData) => {
    onSubmitStart?.();
    commentMutation.mutate({
      postId,
      data: {
        ...data,
        parentId: data.parentId ? Number(data.parentId) : undefined,
      },
    });
    reset();
  };

  // Auto-grow textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [content]);

  const placeholder = isReply ? `Reply to ${author}` : "Write a comment...";

  const isDisabled = content.trim().length === 0 || content.length > MAX_LENGTH;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <div className="space-y-3">
        <div className="flex justify-center items-center">
          <div className="relative w-full">
            <textarea
              {...register("content")}
              ref={(e) => {
                register("content").ref(e);
                textareaRef.current = e;
              }}
              placeholder={placeholder}
              className={`
              w-full
              min-h-[50px]
              resize-none
              overflow-hidden
              border-b-2 border-b-muted-foreground
              focus:outline-none focus:ring-0 focus:border-b-muted-foreground
              ${isReply ? "placeholder:text-sm" : ""}
            `}
            />

            <div className="absolute right-0 -bottom-2.5 text-right text-xs text-muted-foreground">
              <span
                className={content.length > MAX_LENGTH ? "text-red-500" : ""}
              >
                {content.length}
              </span>
              /{MAX_LENGTH}
            </div>
          </div>

          {isReply && (
            <input type="hidden" {...register("parentId")} value={parentId} />
          )}

          <div className="px-5">
            <Button
              variant="secondary"
              type="submit"
              disabled={isDisabled || commentMutation.isPending}
            >
              <Send />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
