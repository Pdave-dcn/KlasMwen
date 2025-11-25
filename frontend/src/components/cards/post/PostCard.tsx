import { useNavigate } from "react-router-dom";

import { toast } from "sonner";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToggleBookmarkMutation } from "@/queries/bookmark.query";
import { useToggleLikeMutation } from "@/queries/like.query";
import { useAuthStore } from "@/stores/auth.store";
import type { Post } from "@/zodSchemas/post.zod";

import PostCardActions from "./PostCardActions";
import PostCardContent from "./PostCardContent";
import PostCardHeader from "./PostCardHeader";
import PostCardTags from "./PostCardTags";

interface PostCardProps {
  post: Post;
  onComment?: (postId: string) => void;
}

const PostCard = ({ post, onComment }: PostCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const toggleBookmarkMutation = useToggleBookmarkMutation(
    post.id,
    post.isBookmarked
  );
  const toggleLikeMutation = useToggleLikeMutation(post.id);

  if (!user) return null;

  const handlePostNavigation = async () => {
    await navigate(`/@${post.author.username}/post/${post.id}`);
  };

  const handleUserNavigation = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();

    if (user.id === userId) {
      await navigate(`/profile/me`);
    } else {
      await navigate(`/profile/${userId}`);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLikeMutation.mutate();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmarkMutation.mutate();
  };

  // ! Not in use
  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComment?.(post.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // * share logic here
    toast.info("Share feature coming soon!");
  };

  return (
    <Card
      className="w-full max-w-2xl cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={handlePostNavigation}
    >
      <CardHeader className="pb-3">
        <PostCardHeader
          post={post}
          user={user}
          onUserNavigation={handleUserNavigation}
        />
      </CardHeader>

      <CardContent className="space-y-4">
        <PostCardContent post={post} />
        <PostCardTags tags={post.tags} />
        <PostCardActions
          post={post}
          onLike={handleLike}
          onComment={handleComment}
          onBookmark={handleBookmark}
          onShare={handleShare}
          isLikePending={toggleLikeMutation.isPending}
          isBookmarkPending={toggleBookmarkMutation.isPending}
        />
      </CardContent>
    </Card>
  );
};

export default PostCard;
