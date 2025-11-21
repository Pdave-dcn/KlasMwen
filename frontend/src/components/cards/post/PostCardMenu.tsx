import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

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
import { hasPermission } from "@/lib/permissions";
import type { User } from "@/lib/permissions/types";
import { useToggleBookmarkMutation } from "@/queries/bookmark.query";
import { useDeletePostMutation } from "@/queries/post.query";
import { usePostEditStore } from "@/stores/postEdit.store";
import { useReportModalStore } from "@/stores/reportModal.store";
import { formatTimeRemaining } from "@/utils/dateFormatter.util";
import type { Post } from "@/zodSchemas/post.zod";

interface PostCardMenuProps {
  post: Post;
  user: User;
}

const ALLOWED_EDIT_TIME_MS = 5 * 60 * 1000; // 5 minutes

const PostCardMenu = ({ post, user }: PostCardMenuProps) => {
  const [canEdit, setCanEdit] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const createdAt = new Date(post.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();

    let timer: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    if (diffMs < ALLOWED_EDIT_TIME_MS) {
      setCanEdit(true);
      const remainingTime = ALLOWED_EDIT_TIME_MS - diffMs;
      setTimeRemaining(remainingTime);

      // Update countdown every second
      interval = setInterval(() => {
        const currentDiff = new Date().getTime() - createdAt.getTime();
        const remaining = ALLOWED_EDIT_TIME_MS - currentDiff;

        if (remaining > 0) {
          setTimeRemaining(remaining);
        } else {
          setTimeRemaining(0);
          clearInterval(interval);
        }
      }, 1000);

      // Set timeout to disable edit
      timer = setTimeout(() => {
        setCanEdit(false);
      }, remainingTime);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [post]);

  const { openEditForm } = usePostEditStore();
  const { openReportModal } = useReportModalStore();

  const deletePostMutation = useDeletePostMutation(post.id);
  const toggleBookmarkMutation = useToggleBookmarkMutation(post.id, false);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEditForm(post);
  };

  const handleDeletePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    deletePostMutation.mutate();
  };

  const handleGoToPost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigate(`/@${post.author.username}/post/${post.id}`);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmarkMutation.mutate();
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    openReportModal(post.id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group">
        <MoreHorizontal className="w-4 h-4 group-hover:text-primary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {hasPermission(user, "posts", "update", post) && canEdit && (
          <>
            <DropdownMenuItem onClick={(e) => handleEditClick(e)}>
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
          <DropdownMenuItem onClick={(e) => handleBookmark(e)}>
            <Bookmark />
            Add to favorites
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={(e) => handleGoToPost(e)}>
          <ArrowRightToLine />
          Go to post
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {hasPermission(user, "posts", "delete", post) && (
          <DropdownMenuItem onClick={(e) => handleDeletePost(e)}>
            <Trash2 className="text-destructive" />
            <span className="text-destructive font-bold">Delete</span>
          </DropdownMenuItem>
        )}
        {hasPermission(user, "posts", "report", post) && (
          <DropdownMenuItem onClick={(e) => handleReport(e)}>
            <TriangleAlert className="text-destructive" />
            <span className="text-destructive font-bold">Report</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PostCardMenu;
