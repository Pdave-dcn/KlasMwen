import transformPostTagsToFlat from "./postTagFlattener";

import type {
  Comment,
  CommentPaginationResult,
  RawPostWithComments,
  TransformedPostWithPagination,
} from "../types/postTypes";

/**
 * Handles comment pagination logic by processing fetched comments and generating pagination metadata.
 *
 * This function expects that you've already fetched `limit + 1` comments from the database.
 * It removes the extra comment (if present) and generates pagination metadata including
 * whether there's a next page and the cursor for the next request.
 *
 * @param {Comment[]} comments - Array of comments fetched from database (should be limit + 1)
 * @param {number} limit - The intended limit of comments per page
 * @param {number} totalComments - Total number of comments for this post
 * @return {*}  {CommentPaginationResult} - Object containing paginated comments and pagination metadata
 *
 */
const handleCommentPagination = (
  comments: Comment[],
  limit: number,
  totalComments: number
): CommentPaginationResult => {
  // Create a copy to avoid mutating the original array
  const paginatedComments = [...comments];
  const hasNextPage = paginatedComments.length > limit;

  // Remove the extra comments if we have more than the limit
  if (hasNextPage) {
    paginatedComments.splice(limit);
  }

  // Generate the next cursor (ID of the last comment in the current page)
  const nextCursor =
    hasNextPage && paginatedComments.length > 0
      ? paginatedComments[paginatedComments.length - 1].id.toString()
      : null;

  return {
    paginatedComments,
    paginationMeta: {
      hasNextPage,
      nextCursor,
      totalComments,
    },
  };
};

/**
 * Handles comment pagination and creates the final transformed post object.
 *
 * This function:
 * 1. Processes comment pagination (removes extra comment, generates cursor)
 * 2. Uses the existing transformPostTagsToFlat for post formatting
 * 3. Adds pagination metadata to the final result
 *
 * @param {RawPostWithComments} post - Raw post object with comments and postTags
 * @param {number} commentLimit - The limit used when fetching comments
 * @return {*}  {TransformedPostWithPagination} - Transformed post with paginated comments and pagination metadata
 * @see transformPostTagsToFlat - Transforms postTags to a flat tags array.
 *
 */
const handlePostWithCommentPagination = (
  post: RawPostWithComments,
  commentLimit: number
): TransformedPostWithPagination => {
  // Handle comment pagination logic
  const { paginatedComments, paginationMeta } = handleCommentPagination(
    post.comments,
    commentLimit,
    post._count.comments
  );

  // Use existing post transformation function
  const transformedPost = transformPostTagsToFlat({
    ...post,
    comments: paginatedComments,
  });

  // Add pagination metadata to the transformed post
  return {
    ...transformedPost,
    commentsPagination: paginationMeta,
  };
};

export { handleCommentPagination, handlePostWithCommentPagination };
