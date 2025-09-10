import { BookOpen } from "lucide-react";

import type { Post } from "@/zodSchemas/post.zod";

import ProfilePostsList from "./ProfilePostsList";

import type {
  InfiniteData,
  InfiniteQueryObserverResult,
} from "@tanstack/react-query";

type PostsResponse = {
  data: Post[];
};

interface ProfilePostsProps {
  posts: InfiniteData<PostsResponse> | undefined;
  postsLoading: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<
    InfiniteQueryObserverResult<InfiniteData<PostsResponse>>
  >;
  isFetchingNextPage: boolean;
  error: Error | null;
}

const ProfilePosts = ({
  posts,
  postsLoading,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  error,
}: ProfilePostsProps) => {
  return (
    <ProfilePostsList
      posts={posts}
      isLoading={postsLoading}
      error={error}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
      loadingText="Loading posts..."
      errorTitle="Error loading posts"
      emptyState={{
        icon: BookOpen,
        title: "No posts yet",
        description:
          "Start sharing your knowledge and connect with your peers!",
      }}
      showBookmarkAction
    />
  );
};

export default ProfilePosts;
