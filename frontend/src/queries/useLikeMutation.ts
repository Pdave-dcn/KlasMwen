import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { toggleLike } from "@/api/like.api";
import type { PostResponse } from "@/zodSchemas/post.zod";

type PostData = InfiniteData<PostResponse>;

const useToggleLikeMutation = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleLike(postId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      const queryKeysToUpdate = queryClient
        .getQueryCache()
        .getAll()
        .map((query) => query.queryKey)
        .filter((key) => Array.isArray(key) && key[0] === "posts");

      const prevDataMap: Record<string, unknown> = {};

      for (const key of queryKeysToUpdate) {
        const prevData = queryClient.getQueryData<PostData>(key);
        prevDataMap[JSON.stringify(key)] = prevData;

        queryClient.setQueryData<PostData>(key, (oldData) => {
          if (!oldData) return oldData;

          if (oldData.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                page: page.data.map((post) =>
                  post.id === postId
                    ? { ...post, isLiked: !post.isLiked }
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
      if (context?.prevDataMap) {
        for (const [keyStr, data] of Object.entries(context.prevDataMap)) {
          queryClient.setQueryData(JSON.parse(keyStr), data);
        }
      }

      toast.error("Failed to update like");
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export { useToggleLikeMutation };
