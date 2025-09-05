import { BookOpen } from "lucide-react";

import { PostCard } from "@/components/PostCard";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { Post } from "@/zodSchemas/post.zod";

import type { InfiniteData } from "@tanstack/react-query";

type PostsResponse = {
  data: Post[];
};

interface ProfilePostsProps {
  posts: InfiniteData<PostsResponse>;
  postsLoading: boolean;
}

const ProfilePosts = ({ posts, postsLoading }: ProfilePostsProps) => {
  if (postsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-muted-foreground">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (posts?.pages.every((page) => page.data.length === 0)) {
    return (
      <Card className="p-8 text-center">
        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No posts yet
        </h3>
        <p className="text-muted-foreground">
          Start sharing your knowledge and connect with your peers!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts?.pages.flatMap((page) =>
        page.data.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={(postId) => console.log("Like post:", postId)}
            onBookmark={(postId) => console.log("Bookmark post:", postId)}
            onComment={(postId) => console.log("Comment on post:", postId)}
          />
        ))
      )}
    </div>
  );
};

export default ProfilePosts;
