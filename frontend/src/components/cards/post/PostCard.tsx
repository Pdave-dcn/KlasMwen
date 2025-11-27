import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePostCardActions } from "@/hooks/usePostCardActions";
import type { Post } from "@/zodSchemas/post.zod";

import PostCardActions from "./PostCardActions";
import PostCardContent from "./PostCardContent";
import PostCardHeader from "./PostCardHeader";
import PostCardTags from "./PostCardTags";

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const { user, handlers, mutations } = usePostCardActions({ post });

  if (!user) return null;
  return (
    <Card
      className="w-full max-w-2xl cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={handlers.handlePostNavigation}
    >
      <CardHeader className="pb-3">
        <PostCardHeader
          post={post}
          user={user}
          onUserNavigation={handlers.handleUserNavigation}
        />
      </CardHeader>

      <CardContent className="space-y-4">
        <PostCardContent post={post} />
        <PostCardTags tags={post.tags} />
        <PostCardActions
          post={post}
          onLike={handlers.handleLike}
          onBookmark={handlers.handleBookmark}
          onShare={handlers.handleShare}
          isLikePending={mutations.toggleLikeMutation.isPending}
          isBookmarkPending={mutations.toggleBookmarkMutation.isPending}
        />
      </CardContent>
    </Card>
  );
};

export default PostCard;
