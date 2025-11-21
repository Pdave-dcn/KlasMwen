import { MessageSquare } from "lucide-react";

import { useProfileBookmarks } from "@/queries/profile.query";

import ProfilePostsList from "../ProfilePostsList";

const ProfileBookmarks = () => {
  const {
    data: posts,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useProfileBookmarks();

  return (
    <ProfilePostsList
      posts={posts}
      isLoading={isLoading}
      error={error}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
      loadingText="Loading saved posts..."
      errorTitle="Error loading saved posts"
      emptyState={{
        icon: MessageSquare,
        title: "No saved posts yet",
        description:
          "Save posts to read them later or reference them for your studies",
      }}
    />
  );
};

export default ProfileBookmarks;
