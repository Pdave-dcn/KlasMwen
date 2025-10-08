import type { TransformedPost } from "../../types/postTypes";

type PostForTruncation = Omit<
  TransformedPost,
  "updatedAt" | "mimeType" | "fileSize" | "comments"
>;

type PostPreview = Omit<PostForTruncation, "content"> & {
  content: string | null;
};

function truncateByWords(text: string, wordLimit: number): string {
  if (!text?.trim()) return "";

  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return text.trim();
  return words.slice(0, wordLimit).join(" ") + "...";
}

/**
 * Truncates post content to create previews with specified word limit.
 *
 * @param {PostForTruncation[]} posts - Posts to truncate
 * @param {number} [wordLimit=50] - Max words in preview
 * @return {PostPreview[]} Posts with truncated content
 */
const truncatePostContentValue = (
  posts: PostForTruncation[],
  wordLimit = 50
): PostPreview[] => {
  return posts.map((post): PostPreview => {
    const shouldTruncateContent =
      post.content && post.content.trim().length > 0;
    const preview = shouldTruncateContent
      ? truncateByWords(post.content ?? "", wordLimit)
      : null;

    return {
      ...post,
      content: preview,
    };
  });
};

export { truncatePostContentValue, PostPreview };
