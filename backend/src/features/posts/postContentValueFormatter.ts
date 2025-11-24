import MarkdownIt from "markdown-it";

import type { TransformedPost } from "../../types/postTypes.js";

type PostForTruncation = Omit<
  TransformedPost,
  "updatedAt" | "mimeType" | "fileSize" | "comments"
>;

type PostPreview = Omit<PostForTruncation, "content"> & {
  content: string | null;
};

const md = new MarkdownIt();

/**
 * Determines whether a token should be skipped
 */
function isInteractiveToken(token: MarkdownIt.Token): boolean {
  return (
    token.type.startsWith("table") ||
    token.type === "link_open" ||
    token.type === "link_close" ||
    token.type === "checkbox_input" ||
    token.type === "image"
  );
}

/** Clone a token while preserving prototype methods */
function cloneToken(token: MarkdownIt.Token): MarkdownIt.Token {
  // create a new object that inherits from the original token's prototype
  const cloned = Object.create(
    Object.getPrototypeOf(token)
  ) as MarkdownIt.Token;
  // copy own properties
  Object.assign(cloned, token);

  // If token.children is an array, clone the array reference
  if (Array.isArray(token.children)) {
    cloned.children = [...token.children];
  }

  return cloned;
}

/**
 * Truncates children tokens by a given word count limit.
 */
function truncateChildren(
  children: MarkdownIt.Token[],
  limit: number,
  counter: { count: number }
): MarkdownIt.Token[] {
  const truncated: MarkdownIt.Token[] = [];

  for (const child of children) {
    if (isInteractiveToken(child)) continue;

    const words = child.content.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      truncated.push(child);
      continue;
    }

    const remaining = limit - counter.count;

    if (remaining <= 0) break;

    if (words.length > remaining) {
      const newChild = cloneToken(child);
      newChild.content = words.slice(0, remaining).join(" ") + "...";
      truncated.push(newChild);
      counter.count = limit;
      break;
    }

    counter.count += words.length;
    truncated.push(child);
  }

  return truncated;
}

/**
 * Safely truncates markdown content for previews.
 * - Removes interactivity (links, tables, etc.)
 * - Preserves basic formatting
 * - Truncates by word count
 */
function truncateMarkdown(source: string, wordLimit = 50): string {
  const tokens = md.parse(source, {});
  const truncatedTokens: MarkdownIt.Token[] = [];
  const counter = { count: 0 };

  for (const token of tokens) {
    if (isInteractiveToken(token)) continue;

    const newToken = cloneToken(token);
    if (token.children && token.children.length > 0) {
      newToken.children = truncateChildren(token.children, wordLimit, counter);
    }

    truncatedTokens.push(newToken);
    if (counter.count >= wordLimit) break;
  }

  return md.renderer.render(truncatedTokens, md.options, {});
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
      ? truncateMarkdown(post.content ?? "", wordLimit)
      : null;

    return {
      ...post,
      content: preview,
    };
  });
};

export { truncatePostContentValue, PostPreview };
