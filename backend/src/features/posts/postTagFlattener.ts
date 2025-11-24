import type { RawPost, TransformedPost } from "../../types/postTypes.js";

/**
 * Transforms a RawPost object by converting its nested postTags into a simplified tags array.
 *
 * This function takes a RawPost, which includes nested postTags data from the junction table,
 * and returns a TransformedPost where the tags are extracted into a flat array for easier access.
 * The original postTags property is removed from the result.
 *
 * Example transformation:
 * - Converts post.postTags: [{postId: "1a-2b-3e", tagId: 1, tag: { id: 1, name: "Tech" }}, ...]
 *   → post.tags: [{ id: 1, name: "Tech" }, ...]
 *
 * @param {RawPost} post - The raw post object containing nested postTags junction table data.
 * @returns {TransformedPost} A post object with a flat tags array, excluding the original postTags.
 */
const transformPostTagsToFlat = (post: RawPost): TransformedPost => {
  const { postTags, ...restOfPost } = post;

  return {
    ...restOfPost,
    tags: postTags.map((pt) => pt.tag),
  };
};

export default transformPostTagsToFlat;
