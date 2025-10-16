/* eslint-disable complexity */
import { useState } from "react";

import { useParams } from "react-router-dom";

import {
  CalendarDays,
  FileText,
  MessageCircle,
  Tag,
  Download,
  Heart,
  Bookmark,
} from "lucide-react";

import CommentCard from "@/components/cards/Comment/CommentCard";
import CommentForm from "@/components/CommentForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PostError from "@/features/postView/components/PostError";
import PostLoading from "@/features/postView/components/PostLoading";
import PostNotFound from "@/features/postView/components/PostNotFound";
import { useToggleBookmarkMutation } from "@/queries/useBookmarkMutation";
import { useToggleLikeMutation } from "@/queries/useLikeMutation";
import { useSinglePostQuery } from "@/queries/usePosts";
import { formatDate } from "@/utils/dateFormatter.util";
import { getInitials } from "@/utils/getInitials.util";

const PostView = () => {
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);

  const { id: postId } = useParams();
  const {
    data: post,
    isLoading,
    error,
    refetch,
  } = useSinglePostQuery(postId ?? "");

  const toggleBookmarkMutation = useToggleBookmarkMutation(
    post?.id as string,
    post?.isBookmarked as boolean
  );

  const toggleLikeMutation = useToggleLikeMutation(post?.id as string);

  if (isLoading) {
    return <PostLoading />;
  }

  if (error) {
    return <PostError error={error} onRetry={() => refetch()} />;
  }

  if (!post) {
    return <PostNotFound />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Main Post Card */}
      <Card className="w-full">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Badge className="bg-primary/10 text-primary">
                <FileText className="w-3 h-3 mr-1" />
                {post.type}
              </Badge>
              <CardTitle className="text-2xl font-bold leading-tight">
                {post.title}
              </CardTitle>
            </div>
            {/* Bookmark Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleBookmarkMutation.mutate()}
              disabled={toggleBookmarkMutation.isPending}
              className="shrink-0"
            >
              <Bookmark
                className={`w-5 h-5 ${
                  post.isBookmarked ? "fill-current text-primary" : ""
                }`}
              />
            </Button>
          </div>

          {/* Author and Date Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={post.author.avatar.url}
                  alt={post.author.username}
                />
                <AvatarFallback>
                  {getInitials(post.author.username)}
                </AvatarFallback>
              </Avatar>
              <Button variant="link" size="sm" className="font-medium text-sm">
                {post.author.username}
              </Button>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarDays className="w-4 h-4 mr-1" />
              {formatDate(post.createdAt)}
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-muted-foreground" />
              {post.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Content */}
          {post.content && (
            <div className="prose max-w-none dark:prose-invert">
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>
          )}

          {/* File Attachment */}
          {post.fileUrl && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{post.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        Attached file
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Post Stats and Actions */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLikeMutation.mutate()}
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
              onClick={() => setIsCommentFormOpen(!isCommentFormOpen)}
            >
              <MessageCircle className="w-4 h-4" />
              <span>{post._count.comments}</span>
            </Button>
          </div>
        </CardContent>
        {isCommentFormOpen && (
          <div className="px-6">
            <CommentForm
              postId={post.id}
              onSubmitStart={() => setIsCommentFormOpen(false)}
            />
          </div>
        )}
        <CardFooter />
      </Card>

      {/* Comments Section */}
      <CommentCard postId={postId ?? ""} />
    </div>
  );
};

export default PostView;
