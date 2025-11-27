import { useNavigate } from "react-router-dom";

import { toast } from "sonner";

import { useToggleBookmarkMutation } from "@/queries/bookmark.query";
import { useToggleLikeMutation } from "@/queries/like.query";
import { useAuthStore } from "@/stores/auth.store";
import type { Post } from "@/zodSchemas/post.zod";

interface UsePostCardActionsProps {
  post: Post;
}

export const usePostCardActions = ({ post }: UsePostCardActionsProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const toggleBookmarkMutation = useToggleBookmarkMutation(
    post.id,
    post.isBookmarked
  );
  const toggleLikeMutation = useToggleLikeMutation(post.id);

  const handlePostNavigation = async () => {
    await navigate(`/@${post.author.username}/post/${post.id}`);
  };

  const handleUserNavigation = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();

    if (user?.id === userId) {
      await navigate(`/profile/me`);
    } else {
      await navigate(`/profile/${userId}`);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLikeMutation.mutate();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmarkMutation.mutate();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("Share feature coming soon!");
  };

  return {
    handlers: {
      handlePostNavigation,
      handleUserNavigation,
      handleLike,
      handleBookmark,
      handleShare,
    },
    mutations: {
      toggleLikeMutation,
      toggleBookmarkMutation,
    },
  };
};
