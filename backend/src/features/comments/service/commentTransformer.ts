import type { CommentWithRelations, TransformedComment } from "./types.js";

/**
 * Utility functions for transforming comment data
 */
class CommentTransformer {
  /**
   * Truncate text with ellipsis
   */
  private static truncateText(
    text: string | null,
    maxLength: number
  ): string | null {
    if (!text) return null;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  /**
   * Transform comments with relations for API response
   */
  static transformCommentsForResponse(
    comments: CommentWithRelations[]
  ): TransformedComment[] {
    return comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        avatar: comment.author.Avatar
          ? { url: comment.author.Avatar.url }
          : null,
      },
      post: {
        id: comment.post.id,
        title: comment.post.title,
        content: this.truncateText(comment.post.content, 150),
        author: comment.post.author,
      },
      parentComment: comment.parent
        ? {
            id: comment.parent.id,
            content: this.truncateText(comment.parent.content, 100) as string,
            author: comment.parent.author,
          }
        : null,
      isReply: Boolean(comment.parent),
    }));
  }
}

export default CommentTransformer;
