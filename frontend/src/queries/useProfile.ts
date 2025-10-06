import {
  useInfiniteQuery,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  getActiveUserBookmarks,
  getActiveUserLikedPosts,
  getActiveUserPosts,
  getUserPosts,
} from "@/api/post.api";
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
    queryKey: ["comments", userId],
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
    queryKey: ["posts", userId, "media"],
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

const useProfilePosts = (userId?: string, limit = 10) => {
  return useInfiniteQuery({
    queryKey: userId ? ["posts", userId] : ["posts", "me"],
    queryFn: ({ pageParam }: { pageParam?: string | number }) => {
      return userId
        ? getUserPosts(userId, pageParam, limit)
        : getActiveUserPosts(pageParam, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

const useProfileLikedPosts = (limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["posts", "liked"],
    queryFn: ({ pageParam }: { pageParam?: string | number }) => {
      return getActiveUserLikedPosts(pageParam, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

const useProfileBookmarks = (limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["posts", "bookmarked"],
    queryFn: ({ pageParam }: { pageParam?: string | number }) => {
      return getActiveUserBookmarks(pageParam, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

export {
  useProfileUser,
  useProfileComments,
  useProfileMedia,
  useProfilePosts,
  useProfileBookmarks,
  useProfileLikedPosts,
};
