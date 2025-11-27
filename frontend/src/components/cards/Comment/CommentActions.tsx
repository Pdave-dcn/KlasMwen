import type { User } from "@/types/auth.type";
import type { Comment } from "@/zodSchemas/comment.zod";

import CommentCardMenu from "./CommentCardMenu";

interface CommentActionsProps {
  comment: Comment;
  user: User;
  onReplyClick: () => void;
}

const CommentActions = ({
  comment,
  user,
  onReplyClick,
}: CommentActionsProps) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onReplyClick}
        type="button"
        className="text-xs text-muted-foreground cursor-pointer hover:underline"
      >
        Reply
      </button>
      <CommentCardMenu comment={comment} user={user} />
    </div>
  );
};

export default CommentActions;
