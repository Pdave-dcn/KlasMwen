import type React from "react";

import { useNavigate } from "react-router-dom";

import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Bookmark,
  ArrowRightToLine,
  TriangleAlert,
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
import { useDeletePostMutation } from "@/queries/usePosts";
import type { Post } from "@/zodSchemas/post.zod";

interface PostCardMenuProps {
  post: Post;
  user: User;
}

export function PostCardMenu({ post, user }: PostCardMenuProps) {
  const navigate = useNavigate();

  const deletePostMutation = useDeletePostMutation(post.id);

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
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group">
        <MoreHorizontal className="w-4 h-4 group-hover:text-primary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {hasPermission(user, "posts", "update", post) && (
          <DropdownMenuItem>
            <Pencil />
            Edit
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={(e) => handleBookmark(e)}>
          <Bookmark />
          Add to favorites
        </DropdownMenuItem>
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
          <DropdownMenuItem>
            <TriangleAlert className="text-destructive" />
            <span className="text-destructive font-bold">Report</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
