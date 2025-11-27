import CommentForm from "@/components/CommentForm";

interface CommentReplyFormProps {
  isOpen: boolean;
  author: string;
  postId: string;
  parentId: number;
  onSubmitStart: () => void;
}

const CommentReplyForm = ({
  isOpen,
  author,
  postId,
  parentId,
  onSubmitStart,
}: CommentReplyFormProps) => {
  if (!isOpen) return null;

  return (
    <div className="mt-2" data-testid={`reply-form-${parentId}`}>
      <CommentForm
        isReply
        author={author}
        postId={postId}
        parentId={parentId}
        onSubmitStart={onSubmitStart}
      />
    </div>
  );
};

export default CommentReplyForm;
