import { Heart } from "lucide-react";

import { useProfileLikedPosts } from "@/queries/useProfile";

import ProfilePostsList from "./ProfilePostsList";

const ProfileLikedPosts = () => {
  const {
    data: posts,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useProfileLikedPosts();

  return (
    <ProfilePostsList
      posts={posts}
      isLoading={isLoading}
      error={error}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
      loadingText="Loading liked posts..."
      errorTitle="Error loading liked posts"
      emptyState={{
        icon: Heart,
        title: "No liked posts yet",
        description:
          "When you like posts, they'll show up here for easy access. Start exploring and engaging with the community!",
      }}
    />
  );
};

export default ProfileLikedPosts;
