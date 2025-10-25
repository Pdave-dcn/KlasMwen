import { Heart, MessageCircle, Bookmark, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Post } from "@/zodSchemas/post.zod";

interface PostCardActionsProps {
  post: Post;
  onLike: (e: React.MouseEvent) => void;
  onComment: (e: React.MouseEvent) => void;
  onBookmark: (e: React.MouseEvent) => void;
  onShare: (e: React.MouseEvent) => void;
  isLikePending: boolean;
  isBookmarkPending: boolean;
}

const PostCardActions = ({
  post,
  onLike,
  onComment,
  onBookmark,
  onShare,
  isLikePending,
  isBookmarkPending,
}: PostCardActionsProps) => {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-border">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLike}
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

        <Button
          variant="ghost"
          size="sm"
          onClick={onComment}
          className="gap-2 text-muted-foreground hover:text-primary"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">{post._count.comments}</span>
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBookmark}
          disabled={isBookmarkPending}
          className={`${
            post.isBookmarked
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          <Bookmark
            className={`w-4 h-4 ${post.isBookmarked ? "fill-current" : ""}`}
          />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary"
          onClick={onShare}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default PostCardActions;
