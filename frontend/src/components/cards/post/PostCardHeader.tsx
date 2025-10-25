import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/auth.type";
import { formatTimeAgo } from "@/utils/dateFormatter.util";
import { getTypeDisplayName } from "@/utils/post.util";
import type { Post } from "@/zodSchemas/post.zod";

import PostCardMenu from "./PostCardMenu";

interface PostCardHeaderProps {
  post: Post;
  user: User;
  onUserNavigation: (e: React.MouseEvent, userId: string) => void;
}

const PostCardHeader = ({
  post,
  user,
  onUserNavigation,
}: PostCardHeaderProps) => {
  return (
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
              onClick={(e) => onUserNavigation(e, post.author.id)}
              aria-label="Go to user profile"
            >
              @{post.author.username}
            </Button>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(post.createdAt)}
            </span>
            <Badge variant="outline" className="text-xs">
              {getTypeDisplayName(post.type)}
            </Badge>
          </div>
        </div>
      </div>
      <PostCardMenu user={user} post={post} />
    </div>
  );
};

export default PostCardHeader;
