import { useCommentStore } from "@/stores/comment.store";
import type { Comment } from "@/zodSchemas/comment.zod";

import RepliesList from "../../RepliesList";
import { Separator } from "../../ui/separator";

import CommentActions from "./CommentActions";
import CommentAuthor from "./CommentAuthor";
import CommentContent from "./CommentContent";
import CommentRepliesToggle from "./CommentRepliesToggle";
import CommentReplyForm from "./CommentReplyForm";

interface CommentItemProps {
  comment: Comment;
  showSeparator: boolean;
}

const CommentItem = ({ comment, showSeparator }: CommentItemProps) => {
  const {
    user,
    handleUserClick,
    toggleReplies,
    openReplies,
    postId,
    openCommentForm,
    toggleCommentForm,
  } = useCommentStore();

  if (!user) return null;

  return (
    <div>
      <div className="flex space-x-3 group">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <CommentAuthor
              author={comment.author}
              createdAt={comment.createdAt}
              onUserClick={handleUserClick}
            />
            <CommentActions
              comment={comment}
              user={user}
              onReplyClick={() => toggleCommentForm(comment.id)}
            />
          </div>

          <div className="ml-11">
            <CommentContent content={comment.content} />

            <CommentReplyForm
              isOpen={openCommentForm.has(comment.id)}
              author={comment.author.username}
              postId={postId}
              parentId={comment.id}
              onSubmitStart={() => toggleCommentForm(comment.id)}
            />

            <CommentRepliesToggle
              totalReplies={comment.totalReplies}
              isOpen={openReplies.has(comment.id)}
              onToggle={() => toggleReplies(comment.id)}
            />
          </div>
        </div>
      </div>

      {openReplies.has(comment.id) && (
        <RepliesList parentId={comment.id} postId={postId} />
      )}
      {showSeparator && <Separator className="mt-4" />}
    </div>
  );
};

export default CommentItem;
