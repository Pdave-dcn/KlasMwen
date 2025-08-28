import { useState } from "react";

import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface User {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  role: "student" | "admin";
  university?: string;
  major?: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  category:
    | "math"
    | "physics"
    | "programming"
    | "chemistry"
    | "biology"
    | "default";
}

interface Post {
  id: string;
  author: User;
  content: string;
  title?: string;
  tags: Tag[];
  likes: number;
  likedByUser: boolean;
  bookmarkedByUser: boolean;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
  type: "note" | "question" | "resource";
}

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onComment?: (postId: string) => void;
}

export const PostCard = ({
  post,
  onLike,
  onBookmark,
  onComment,
}: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(post.likedByUser);
  const [isBookmarked, setIsBookmarked] = useState(post.bookmarkedByUser);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(post.id);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.(post.id);
  };

  const getTagClassName = (category: string) => {
    return `tag-${category}`;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  return (
    <Card className="card-hover interactive-hover border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback>
                {post.author.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{post.author.name}</h3>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(post.createdAt)}
                </span>
              </div>
              {post.author.university && (
                <p className="text-xs text-muted-foreground">
                  {post.author.university}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {post.title && (
          <h2 className="text-lg font-semibold leading-tight">{post.title}</h2>
        )}

        <p className="text-foreground leading-relaxed">{post.content}</p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className={`text-xs ${getTagClassName(tag.category)} border`}
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
              className={`gap-2 ${
                isLiked
                  ? "text-red-500 hover:text-red-600"
                  : "text-muted-foreground hover:text-red-500"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              <span className="text-sm">{post.likes}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComment?.(post.id)}
              className="gap-2 text-muted-foreground hover:text-primary"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{post.commentsCount}</span>
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              className={`${
                isBookmarked
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Bookmark
                className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`}
              />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
