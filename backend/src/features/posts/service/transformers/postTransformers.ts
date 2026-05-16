import MarkdownIt from "markdown-it";

import type {
  BasePost,
  ExtendedPost,
  TransformedPost,
  ResourcePost,
  TextPost,
  PostPreview,
  EditResponse,
} from "../types/postTypes.js";

interface IPostTransformer {
  transformPost(post: BasePost | ExtendedPost): TransformedPost;
  transformPosts(posts: (BasePost | ExtendedPost)[]): TransformedPost[];
  transformPostsWithTruncation(posts: (BasePost | ExtendedPost)[]): PostPreview[];
  toEditResponse(post: TransformedPost): EditResponse;
}

class PostTransformer implements IPostTransformer {
  transformPost(post: BasePost | ExtendedPost): TransformedPost {
    const { postTags, ...restOfPost } = post;
    return {
      ...restOfPost,
      tags: (postTags ?? []).map((pt) => pt.tag),
    } as TransformedPost;
  }

  transformPosts(posts: (BasePost | ExtendedPost)[]): TransformedPost[] {
    return posts.map((post) => this.transformPost(post));
  }

  transformPostsWithTruncation(posts: (BasePost | ExtendedPost)[]): PostPreview[] {
    const transformed = this.transformPosts(posts);
    return this.truncatePostContentValue(transformed, 100);
  }

  toEditResponse(post: TransformedPost): EditResponse {
    const baseEditData = {
      id: post.id,
      title: post.title,
      type: post.type,
      tags: post.tags,
      hasFile: false,
    };

    if (this.isResourcePost(post)) {
      return {
        ...baseEditData,
        fileName: post.fileName,
        fileSize: post.fileSize,
        hasFile: true,
      };
    } else if (this.isTextPost(post)) {
      return {
        ...baseEditData,
        content: post.content,
        hasFile: false,
      };
    }

    return {
      ...baseEditData,
      hasFile: false,
      content: "",
    } as EditResponse;
  }

  private isResourcePost(post: TransformedPost): post is ResourcePost {
    return post.type === "RESOURCE" && post.fileUrl !== null;
  }

  private isTextPost(post: TransformedPost): post is TextPost {
    return (
      (post.type === "QUESTION" || post.type === "NOTE") &&
      post.content !== null
    );
  }

  private truncatePostContentValue(
    posts: TransformedPost[],
    wordLimit = 50,
  ): PostPreview[] {
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
  }
}

const postTransformer = new PostTransformer();

function isInteractiveToken(token: MarkdownIt.Token): boolean {
  return (
    token.type.startsWith("table") ||
    token.type === "link_open" ||
    token.type === "link_close" ||
    token.type === "checkbox_input" ||
    token.type === "image"
  );
}

function cloneToken(token: MarkdownIt.Token): MarkdownIt.Token {
  const cloned = Object.create(
    Object.getPrototypeOf(token),
  ) as MarkdownIt.Token;
  Object.assign(cloned, token);
  if (Array.isArray(token.children)) {
    cloned.children = [...token.children];
  }
  return cloned;
}

function truncateChildren(
  children: MarkdownIt.Token[],
  limit: number,
  counter: { count: number },
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

function truncateMarkdown(source: string, wordLimit = 50): string {
  const md = new MarkdownIt();
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

export { postTransformer, type IPostTransformer };
