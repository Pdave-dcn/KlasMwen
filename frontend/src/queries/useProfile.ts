import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  getActiveUserProfile,
  getUserProfile,
  getUserProfileComments,
} from "@/api/user.api";

const useProfileUser = (userId?: string) => {
  return useQuery({
    queryKey: userId ? ["profile", userId] : ["me"],
    queryFn: userId
      ? () => getUserProfile(userId)
      : () => getActiveUserProfile(),
  });
};

const useProfileComments = (userId: string, limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["profile", userId, "comments"],
    queryFn: ({ pageParam }: { pageParam?: string | number }) => {
      return getUserProfileComments(userId, pageParam as number, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

export { useProfileUser, useProfileComments };
