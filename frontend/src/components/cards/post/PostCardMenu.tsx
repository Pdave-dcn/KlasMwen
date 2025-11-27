import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Bookmark,
  ArrowRightToLine,
  TriangleAlert,
  Clock,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePostCardMenu } from "@/hooks/usePostCardMenu";
import { formatTimeRemaining } from "@/utils/dateFormatter.util";
import type { Post } from "@/zodSchemas/post.zod";

interface PostCardMenuProps {
  post: Post;
}

const PostCardMenu = ({ post }: PostCardMenuProps) => {
  const { canEdit, timeRemaining, permissions, handlers } = usePostCardMenu({
    post,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group">
        <MoreHorizontal className="w-4 h-4 group-hover:text-primary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {permissions.canUpdate && canEdit && (
          <>
            <DropdownMenuItem onClick={handlers.handleEditClick}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>
                Edit available for {formatTimeRemaining(timeRemaining)}
              </span>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {!post.isBookmarked && (
          <DropdownMenuItem onClick={handlers.handleBookmark}>
            <Bookmark />
            Add to favorites
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handlers.handleGoToPost}>
          <ArrowRightToLine />
          Go to post
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {permissions.canDelete && (
          <DropdownMenuItem onClick={handlers.handleDeletePost}>
            <Trash2 className="text-destructive" />
            <span className="text-destructive font-bold">Delete</span>
          </DropdownMenuItem>
        )}
        {permissions.canReport && (
          <DropdownMenuItem onClick={handlers.handleReport}>
            <TriangleAlert className="text-destructive" />
            <span className="text-destructive font-bold">Report</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PostCardMenu;
