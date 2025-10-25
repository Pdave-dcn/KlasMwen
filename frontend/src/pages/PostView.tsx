import { useState } from "react";

import { useParams } from "react-router-dom";

import CommentCard from "@/components/cards/Comment/CommentCard";
import CommentForm from "@/components/CommentForm";
import { Card, CardFooter } from "@/components/ui/card";
import PostActions from "@/features/postView/components/PostActions";
import PostContent from "@/features/postView/components/PostContent";
import PostError from "@/features/postView/components/PostError";
import PostHeader from "@/features/postView/components/PostHeader";
import PostLoading from "@/features/postView/components/PostLoading";
import PostNotFound from "@/features/postView/components/PostNotFound";
import { useToggleBookmarkMutation } from "@/queries/useBookmarkMutation";
import { useToggleLikeMutation } from "@/queries/useLikeMutation";
import { useSinglePostQuery } from "@/queries/usePosts";

const PostView = () => {
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);
  const { id: postId } = useParams();
  const {
    data: post,
    isLoading,
    error,
    refetch,
  } = useSinglePostQuery(postId ?? "");

  const toggleBookmarkMutation = useToggleBookmarkMutation(
    post?.id as string,
    post?.isBookmarked as boolean
  );
  const toggleLikeMutation = useToggleLikeMutation(post?.id as string);

  if (isLoading) return <PostLoading />;
  if (error) return <PostError error={error} onRetry={() => refetch()} />;
  if (!post) return <PostNotFound />;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="w-full">
        <PostHeader
          post={post}
          onToggleBookmark={() => toggleBookmarkMutation.mutate()}
          isBookmarkPending={toggleBookmarkMutation.isPending}
        />

        <PostContent post={post} />

        <PostActions
          post={post}
          onToggleLike={() => toggleLikeMutation.mutate()}
          isLikePending={toggleLikeMutation.isPending}
          onToggleCommentForm={() => setIsCommentFormOpen(!isCommentFormOpen)}
        />

        {isCommentFormOpen && (
          <div className="px-6">
            <CommentForm
              postId={post.id}
              onSubmitStart={() => setIsCommentFormOpen(false)}
            />
          </div>
        )}
        <CardFooter />
      </Card>

      <CommentCard postId={postId ?? ""} />
    </main>
  );
};

export default PostView;
