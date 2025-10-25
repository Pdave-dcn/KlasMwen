import { Heart, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Post } from "@/zodSchemas/post.zod";

interface PostActionsProps {
  post: Post;
  onToggleLike: () => void;
  isLikePending: boolean;
  onToggleCommentForm: () => void;
}

const PostActions = ({
  post,
  onToggleLike,
  isLikePending,
  onToggleCommentForm,
}: PostActionsProps) => {
  return (
    <div className="px-6 pb-4">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleLike}
          disabled={isLikePending}
          className={`gap-2 ${
            post.isLiked
              ? "text-red-500 hover:text-red-600"
              : "text-muted-foreground hover:text-red-500"
          }`}
        >
          <Heart className={`w-4 h-4 ${post.isLiked ? "fill-current" : ""}`} />
          <span className="text-sm">{post._count.likes}</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={onToggleCommentForm}>
          <MessageCircle className="w-4 h-4" />
          <span>{post._count.comments}</span>
        </Button>
      </div>
    </div>
  );
};

export default PostActions;
