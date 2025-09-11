import React from "react";

import { MessageCircle, Reply, Clock, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ProfileComment } from "@/zodSchemas/comment.zod";

interface Author {
  id: string;
  username: string;
}

interface ParentComment {
  id: number;
  content: string;
  author: Author;
}

interface ProfileCommentCardProps {
  comment: ProfileComment;
  onPostClick?: (postId: string) => void;
  onUserClick?: (userId: string) => void;
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const ProfileCommentCard: React.FC<ProfileCommentCardProps> = ({
  comment,
  onPostClick,
  onUserClick,
}) => {
  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const handlePostClick = () => {
    onPostClick?.(comment.post.id);
  };

  const handleUserClick = (userId: string) => {
    onUserClick?.(userId);
  };

  return (
    <Card className="w-full max-w-2xl mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={comment.author.avatar?.url}
                alt={comment.author.username}
              />
              <AvatarFallback>
                {getInitials(comment.author.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <button
                onClick={() => handleUserClick(comment.author.id)}
                className="font-semibold text-sm text-left cursor-pointer hover:underline"
              >
                @{comment.author.username}
              </button>
              <div className="flex items-center text-xs text-muted-foreground space-x-2">
                <Clock className="h-3 w-3" />
                <span>{formatTimeAgo(comment.createdAt)}</span>
              </div>
            </div>
          </div>
          <Badge
            variant={comment.isReply ? "secondary" : "outline"}
            className="ml-2"
          >
            {comment.isReply ? (
              <>
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </>
            ) : (
              <>
                <MessageCircle className="h-3 w-3 mr-1" />
                Comment
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Comment Content */}
        <div className="prose prose-sm max-w-none">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>

        <Separator />

        {/* Parent Comment (if it's a reply) */}
        {comment.isReply && comment.parentComment && (
          <div className="bg-muted/30 rounded-lg p-3 border">
            <div className="flex items-center space-x-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <button
                onClick={() =>
                  handleUserClick(
                    (comment.parentComment as ParentComment).author.id
                  )
                }
                className="text-sm font-medium hover:underline cursor-pointer"
              >
                @{comment.parentComment.author.username}
              </button>
              <span className="text-xs text-muted-foreground">replied to</span>
            </div>
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              "{comment.parentComment.content}"
            </p>
          </div>
        )}

        {/* Original Post Information */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-foreground">
              {comment.isReply ? "Replied to post:" : "Commented on:"}
            </h4>
            <button
              onClick={() => handleUserClick(comment.post.author.id)}
              className="text-xs text-muted-foreground hover:underline cursor-pointer flex items-center space-x-1"
            >
              <User className="h-3 w-3" />
              <span>by @{comment.post.author.username}</span>
            </button>
          </div>

          <button
            onClick={handlePostClick}
            className="w-full text-left group cursor-pointer"
          >
            <h3 className="font-medium text-sm mb-2 group-hover:underline line-clamp-2">
              {comment.post.title}
            </h3>
            {comment.post.content && (
              <p className="text-xs text-muted-foreground leading-relaxed group-hover:text-muted-foreground/80 transition-colors">
                {comment.post.content}
              </p>
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCommentCard;
