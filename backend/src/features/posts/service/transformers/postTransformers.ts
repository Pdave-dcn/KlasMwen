import { truncatePostContentValue } from "../../postContentValueFormatter";
import transformPostTagsToFlat from "../../postTagFlattener";

import type { RawPost, TransformedPost, PostPreview } from "../types/postTypes";

/**
 * PostTransformer - Handles all post transformations
 * - Flattening tags
 * - Truncating content for previews
 */
class PostTransformer {
  /**
   * Transform a single post's tags to flat format
   */
  static transformPost(post: Partial<RawPost>): TransformedPost {
    return transformPostTagsToFlat(post as RawPost);
  }

  /**
   * Transform multiple posts' tags to flat format
   */
  static transformPosts(posts: Partial<RawPost>[]): TransformedPost[] {
    return posts.map((post) => this.transformPost(post));
  }

  /**
   * Transform posts and truncate content for preview
   */
  static transformPostsWithTruncation(
    posts: Partial<RawPost>[]
  ): PostPreview[] {
    const transformed = this.transformPosts(posts);
    return truncatePostContentValue(transformed);
  }
}

export default PostTransformer;
