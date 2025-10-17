import type React from "react";

import { MoreHorizontal, Trash2, TriangleAlert } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { hasPermission } from "@/lib/permissions";
import type { User } from "@/lib/permissions/types";
import { useDeleteCommentMutation } from "@/queries/useComment";
import type { Comment, Reply } from "@/zodSchemas/comment.zod";

interface CommentCardMenuProps {
  comment: Comment | Reply;
  user: User;
}

const CommentCardMenu = ({ comment, user }: CommentCardMenuProps) => {
  const deleteCommentMutation = useDeleteCommentMutation(comment.id);

  const handleDeleteComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCommentMutation.mutate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <MoreHorizontal className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {hasPermission(user, "comments", "delete", comment) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => handleDeleteComment(e)}>
              <Trash2 className="text-destructive" />
              <span className="text-destructive font-bold">Delete</span>
            </DropdownMenuItem>
          </>
        )}

        {hasPermission(user, "comments", "report", comment) && (
          <DropdownMenuItem>
            <TriangleAlert className="text-destructive" />
            <span className="text-destructive font-bold">Report</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CommentCardMenu;
