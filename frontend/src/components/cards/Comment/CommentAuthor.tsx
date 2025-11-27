import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatTimeAgo } from "@/utils/dateFormatter.util";
import { getInitials } from "@/utils/getInitials.util";
import type { Comment } from "@/zodSchemas/comment.zod";

interface CommentAuthorProps {
  author: Comment["author"];
  createdAt: string;
  onUserClick: (userId: string) => void;
}

const CommentAuthor = ({
  author,
  createdAt,
  onUserClick,
}: CommentAuthorProps) => {
  return (
    <div className="flex items-center space-x-3 group">
      <Avatar className="w-8 h-8">
        <AvatarImage src={author.avatar.url} alt={author.username} />
        <AvatarFallback className="text-xs">
          {getInitials(author.username)}
        </AvatarFallback>
      </Avatar>

      <div className="flex items-center space-x-2">
        <Button
          variant="link"
          size="sm"
          onClick={() => onUserClick(author.id)}
          className="font-medium text-sm p-0 h-auto"
        >
          {author.username}
        </Button>
        <span className="text-xs text-muted-foreground">
          {formatTimeAgo(createdAt)}
        </span>
      </div>
    </div>
  );
};

export default CommentAuthor;
