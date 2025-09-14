import { useParams } from "react-router-dom";

import { Image } from "lucide-react";

import { useProfileMedia } from "@/queries/useProfile";

import ProfilePostsList from "./ProfilePostsList";

const ProfileMediaPosts = () => {
  const { id: userId } = useParams();
  const {
    data: posts,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useProfileMedia(userId as string);

  return (
    <ProfilePostsList
      posts={posts}
      isLoading={isLoading}
      error={error}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
      loadingText="Loading media posts..."
      errorTitle="Error loading media posts"
      emptyState={{
        icon: Image,
        title: "No media posts yet",
        description: "Posts with images and media will appear here.",
      }}
      showBookmarkAction
    />
  );
};

export default ProfileMediaPosts;
