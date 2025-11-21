import { useNavigate } from "react-router-dom";

import { CalendarDays, FileText, Tag, Bookmark } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/utils/dateFormatter.util";
import { getInitials } from "@/utils/getInitials.util";
import type { Post } from "@/zodSchemas/post.zod";

interface PostHeaderProps {
  post: Post;
  onToggleBookmark: () => void;
  isBookmarkPending: boolean;
}

const PostHeader = ({
  post,
  onToggleBookmark,
  isBookmarkPending,
}: PostHeaderProps) => {
  const navigate = useNavigate();
  return (
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
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleBookmark}
          disabled={isBookmarkPending}
          className="shrink-0"
        >
          <Bookmark
            className={`w-5 h-5 ${
              post.isBookmarked ? "fill-current text-primary" : ""
            }`}
          />
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Avatar className="w-8 h-8">
            <AvatarImage
              src={post.author.avatar.url}
              alt={post.author.username}
            />
            <AvatarFallback>{getInitials(post.author.username)}</AvatarFallback>
          </Avatar>
          <Button
            variant="link"
            size="sm"
            className="font-medium text-sm"
            onClick={() => navigate(`/profile/${post.author.id}`)}
          >
            {post.author.username}
          </Button>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className="w-4 h-4 mr-1" />
          {formatDate(post.createdAt)}
        </div>
      </div>

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
  );
};

export default PostHeader;
