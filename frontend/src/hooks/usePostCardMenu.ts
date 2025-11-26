import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useCan } from "@/hooks/useCan";
import { useToggleBookmarkMutation } from "@/queries/bookmark.query";
import { useDeletePostMutation } from "@/queries/post.query";
import { usePostEditStore } from "@/stores/postEdit.store";
import { useReportModalStore } from "@/stores/reportModal.store";
import type { Post } from "@/zodSchemas/post.zod";

const ALLOWED_EDIT_TIME_MS = 5 * 60 * 1000; // 5 minutes

interface UsePostCardMenuProps {
  post: Post;
}

export const usePostCardMenu = ({ post }: UsePostCardMenuProps) => {
  const [canEdit, setCanEdit] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const navigate = useNavigate();

  const { openEditForm } = usePostEditStore();
  const { openReportModal } = useReportModalStore();

  const deletePostMutation = useDeletePostMutation(post.id);
  const toggleBookmarkMutation = useToggleBookmarkMutation(post.id, false);

  // Permission checks
  const canUpdate = useCan("posts", "update", post);
  const canDelete = useCan("posts", "delete", post);
  const canReport = useCan("posts", "report", post);

  // Edit timer logic
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

  return {
    canEdit,
    timeRemaining,
    permissions: {
      canUpdate,
      canDelete,
      canReport,
    },
    handlers: {
      handleEditClick,
      handleDeletePost,
      handleGoToPost,
      handleBookmark,
      handleReport,
    },
    mutations: {
      deletePostMutation,
      toggleBookmarkMutation,
    },
  };
};
