import {
  useInfiniteQuery,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  getActiveUserProfile,
  getUserProfile,
  getUserProfileComments,
  getUserProfileMediaPosts,
} from "@/api/user.api";

type UserProfile = {
  id: string;
  username: string;
  role: "STUDENT" | "ADMIN";
  bio?: string | null | undefined;
  avatar?:
    | {
        id: number;
        url: string;
      }
    | null
    | undefined;
};

type ActiveUserProfile = UserProfile & {
  email: string;
  createdAt: string;
};

function useProfileUser(userId: string): UseQueryResult<UserProfile, Error>;
function useProfileUser(
  userId: undefined
): UseQueryResult<ActiveUserProfile, Error>;

function useProfileUser(userId?: string) {
  return useQuery({
    queryKey: userId ? ["profile", userId] : ["me"],
    queryFn: userId
      ? () => getUserProfile(userId)
      : () => getActiveUserProfile(),
  });
}

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

const useProfileMedia = (userId: string, limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["profile", userId, "media"],
    queryFn: ({ pageParam }: { pageParam?: string | number }) => {
      return getUserProfileMediaPosts(userId, pageParam as string, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

export { useProfileUser, useProfileComments, useProfileMedia };
