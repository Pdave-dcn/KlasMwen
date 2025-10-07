import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createNewPost,
  deletePost,
  getHomePagePosts,
  getPostById,
} from "@/api/post.api";
import type { PostResponse } from "@/zodSchemas/post.zod";

type FeedData = InfiniteData<PostResponse>;

const usePostCreationMutation = () => {
  const queryClient = useQueryClient();
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
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

const useHomePagePosts = (limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["posts", "feed"],
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
    queryKey: ["posts", postId],
    queryFn: () => {
      return getPostById(postId);
    },
  });
};

/**
 * Custom hook that creates a mutation for deleting a post with optimistic updates.
 * Implements optimistic UI updates by immediately removing the post from feed and user posts,
 * then rolls back on error or revalidates on success.
 *
 * @param {string} postId - The unique identifier of the post to delete
 */
const useDeletePostMutation = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deletePost(postId),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      const queryKeysToUpdate: (string | number)[][] = [
        ["posts", "feed"],
        ["posts", "me"],
      ];

      const prevDataMap: { key: (string | number)[]; data?: FeedData }[] = [];

      for (const key of queryKeysToUpdate) {
        const prevData = queryClient.getQueryData<FeedData>(key);
        prevDataMap.push({ key, data: prevData });

        queryClient.setQueryData<FeedData>(key, (oldData) => {
          if (!oldData) return oldData;
          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.filter((p) => p.id !== postId),
            })),
          };
        });
      }

      return { prevDataMap };
    },

    onError: (_err, _vars, context) => {
      if (context?.prevDataMap) {
        for (const { key, data } of context.prevDataMap) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error("Failed to delete post");
    },

    onSuccess: () => {
      toast("Post deleted");
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export {
  useHomePagePosts,
  useSinglePostQuery,
  usePostCreationMutation,
  useDeletePostMutation,
};
