import { useNavigate } from "react-router-dom";

import { Heart, MessageCircle, Bookmark, Share2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToggleBookmarkMutation } from "@/queries/useBookmarkMutation";
import { useToggleLikeMutation } from "@/queries/useLikeMutation";
import { useAuthStore } from "@/stores/auth.store";
import { formatTimeAgo } from "@/utils/dateFormatter.util";
import { getTypeDisplayName } from "@/utils/post.util";
import type { Post } from "@/zodSchemas/post.zod";

import { PostCardMenu } from "./PostCardMenu";

interface PostCardProps {
  post: Post;
  onComment?: (postId: string) => void;
}

export const PostCard = ({ post, onComment }: PostCardProps) => {
  const navigate = useNavigate();

  const toggleBookmarkMutation = useToggleBookmarkMutation(
    post.id,
    post.isBookmarked
  );

  const toggleLikeMutation = useToggleLikeMutation(post.id);

  const { user } = useAuthStore();
  if (!user) return;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLikeMutation.mutate();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmarkMutation.mutate();
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComment?.(post.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // share logic here
  };

  const handleUserNavigation = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    await navigate(`/profile/${userId}`);
  };

  const handlePostNavigation = async () => {
    await navigate(`/@${post.author.username}/post/${post.id}`);
  };

  return (
    <Card
      className="w-full max-w-2xl cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={handlePostNavigation}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage
                src={post.author.avatar.url ?? undefined}
                alt={post.author.username ?? undefined}
              />
              <AvatarFallback>
                {post.author.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <Button
                  variant="link"
                  size="sm"
                  className="font-semibold text-sm cursor-pointer"
                  onClick={(e) => handleUserNavigation(e, post.author.id)}
                  aria-label="Go to user profile"
                >
                  @{post.author.username}
                </Button>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(post.createdAt)}
                </span>
                <Badge variant="outline" className="text-xs}">
                  {getTypeDisplayName(post.type)}
                </Badge>
              </div>
            </div>
          </div>
          <PostCardMenu user={user} post={post} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <h2 className="text-lg font-semibold leading-tight">{post.title}</h2>

        {post.content && (
          <p className="text-foreground leading-relaxed">{post.content}</p>
        )}

        {/* File attachment indicator */}
        {post.fileUrl && post.fileName && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
            <div className="w-4 h-4 bg-primary/20 rounded" />
            <span className="text-sm text-muted-foreground">
              {post.fileName}
            </span>
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs border"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={toggleLikeMutation.isPending}
              className={`gap-2 ${
                post.isLiked
                  ? "text-red-500 hover:text-red-600"
                  : "text-muted-foreground hover:text-red-500"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${post.isLiked ? "fill-current" : ""}`}
              />
              <span className="text-sm">{post._count.likes}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleComment}
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
              onClick={handleBookmark}
              disabled={toggleBookmarkMutation.isPending}
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
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
