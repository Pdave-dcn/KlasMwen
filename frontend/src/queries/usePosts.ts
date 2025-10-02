import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { createNewPost, getHomePagePosts, getPostById } from "@/api/post.api";

const usePostMutation = () => {
  return useMutation({
    mutationFn: createNewPost,
    onMutate: () => {
      toast("Creating post...");
    },
    onSuccess: () => {
      toast("Your post has been published successfully");
    },
    onError: () => {
      toast.error("Failed to create post");
    },
  });
};

const useHomePagePosts = (limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["home-posts"],
    queryFn: ({ pageParam }: { pageParam?: string | number }) => {
      return getHomePagePosts(pageParam, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

const useSinglePostQuery = (postId: string) => {
  return useQuery({
    queryKey: ["single-post", postId],
    queryFn: () => {
      return getPostById(postId);
    },
  });
};

export { useHomePagePosts, useSinglePostQuery, usePostMutation };
