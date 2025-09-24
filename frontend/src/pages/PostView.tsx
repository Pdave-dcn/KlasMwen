import { useParams } from "react-router-dom";

import {
  CalendarDays,
  FileText,
  MessageCircle,
  Tag,
  Download,
  Heart,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import CommentCard from "@/components/cards/CommentCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useSinglePostQuery } from "@/queries/usePosts";
import { formatDate } from "@/utils/dateFormatter.util";
import { getInitials } from "@/utils/getInitials.util";

const PostLoading = () => (
  <Card>
    <CardHeader>
      <CardTitle />
    </CardHeader>
    <CardContent className="flex items-center justify-center space-y-10">
      <Spinner />
    </CardContent>
  </Card>
);

const PostError = ({ onRetry }: { error: Error; onRetry: () => void }) => (
  <div className="max-w-4xl mx-auto p-6">
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to Load Post</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium">Something went wrong</p>
              <p className="text-sm mt-1">
                We couldn't load this post. Please try again.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="ml-4 flex-shrink-0"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  </div>
);

const PostNotFound = () => (
  <div className="max-w-4xl mx-auto p-6">
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>Post Not Found</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>This post doesn't exist or has been removed.</p>
      </CardContent>
    </Card>
  </div>
);

const PostView = () => {
  const { id: postId } = useParams();
  const {
    data: post,
    isLoading,
    error,
    refetch,
  } = useSinglePostQuery(postId ?? "");

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

          {/* Post Stats */}
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            {post._count.likes && (
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>{post._count.likes} likes</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{post._count.comments} comments</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <CommentCard postId={postId ?? ""} />
    </div>
  );
};

export default PostView;
