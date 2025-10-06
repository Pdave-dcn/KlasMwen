import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { createBookmark, deleteBookmark } from "@/api/bookmark.api";
import type { PostResponse } from "@/zodSchemas/post.zod";

type PostData = InfiniteData<PostResponse>;

/**
 * Custom hook that creates a mutation for toggling a post's bookmark status.
 * Implements optimistic updates by immediately updating all related post queries
 * in the cache before the server request completes.
 *
 * @param {string} postId - The unique identifier of the post to bookmark/unbookmark
 * @param {boolean} isBookmarked - Current bookmark status of the post (true if bookmarked, false otherwise)
 * @returns {UseMutationResult} A mutation object from React Query with methods to trigger the bookmark toggle
 *
 * @example
 * const bookmarkMutation = useToggleBookmarkMutation('post-123', false);
 * bookmarkMutation.mutate(); // Creates a bookmark
 *
 * @example
 * const bookmarkMutation = useToggleBookmarkMutation('post-456', true);
 * bookmarkMutation.mutate(); // Removes the bookmark
 */
const useToggleBookmarkMutation = (postId: string, isBookmarked: boolean) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      isBookmarked ? deleteBookmark(postId) : createBookmark(postId),
    onMutate: async () => {
      // Prevent race conditions by canceling any in-flight post queries
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Find all query keys that start with "posts" to update them optimistically
      const queryKeysToUpdate = queryClient
        .getQueryCache()
        .getAll()
        .map((query) => query.queryKey)
        .filter((key) => Array.isArray(key) && key[0] === "posts");

      // Store previous data for rollback on error
      const prevDataMap: Record<string, unknown> = {};

      for (const key of queryKeysToUpdate) {
        const prevData = queryClient.getQueryData<PostData>(key);
        prevDataMap[JSON.stringify(key)] = prevData;

        // Optimistically update the bookmark status in the cache
        queryClient.setQueryData<PostData>(key, (oldData) => {
          if (!oldData) return oldData;

          // Handle paginated data structure
          if (oldData.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                page: page.data.map((post) =>
                  post.id === postId
                    ? { ...post, isBookmarked: !isBookmarked }
                    : post
                ),
              })),
            };
          }

          return oldData;
        });
      }
      return prevDataMap;
    },
    onError: (_err, _vars, context) => {
      // Rollback: restore all queries to their previous state
      if (context?.prevDataMap) {
        for (const [keyStr, data] of Object.entries(context.prevDataMap)) {
          queryClient.setQueryData(JSON.parse(keyStr), data);
        }
      }
      toast.error("Failed to update bookmark");
    },
    onSettled: async () => {
      // Refetch to ensure cache is in sync with server
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export { useToggleBookmarkMutation };
