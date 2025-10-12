import { isResourcePost, isTextPost } from "./postTypeGuards";

import type { TransformedPost } from "../../types/postTypes";

type EditResponse = {
  id: string;
  title: string;
  tags: TransformedPost["tags"];
  hasFile: boolean;
} & (
  | {
      hasFile: true;
      fileName: string;
      fileSize: number;
    }
  | {
      hasFile: false;
      content: string;
    }
);

/**
 * Transforms a post into edit response format for client consumption.
 * Returns type-specific data: content for text posts, file metadata for resource posts.
 *
 * @param {TransformedPost} post - The post to transform
 * @returns {EditResponse} Edit-ready data with hasFile flag and type-specific fields
 */
const createEditResponse = (post: TransformedPost): EditResponse => {
  const baseEditData = {
    id: post.id,
    title: post.title,
    type: post.type,
    tags: post.tags,
    hasFile: false as const,
  };

  if (isResourcePost(post)) {
    return {
      ...baseEditData,
      fileName: post.fileName,
      fileSize: post.fileSize,
      hasFile: true,
    };
  } else if (isTextPost(post)) {
    return {
      ...baseEditData,
      content: post.content,
      hasFile: false,
    };
  }

  // Fallback for unknown post types
  return {
    ...baseEditData,
    hasFile: false,
    content: "",
  } as EditResponse;
};

export default createEditResponse;
