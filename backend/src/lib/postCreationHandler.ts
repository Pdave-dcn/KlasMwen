/*eslint-disable max-lines-per-function*/
import prisma from "../config/db.js";

import type { CreatePostInput, RawPost } from "../types/postTypes.js";

/**
 * Creates a new post in the database with associated tags.
 *
 * Handles both text and resource post types using a database transaction to ensure
 * atomicity when creating the post and linking tags. Returns the complete post
 * with all related data including author info, tags, and interaction counts.
 *
 * @param {CreatePostInput} completeValidatedData - Validated post data including optional tags
 * @param {string} userId - ID of the user creating the post
 * @returns {Promise<RawPost>} - Complete post with author, tags, and metadata counts
 */
const handlePostCreation = async (
  completeValidatedData: CreatePostInput,
  userId: string
): Promise<RawPost | null> => {
  return await prisma.$transaction(async (tx) => {
    // Build post data based on type
    const baseData = {
      title: completeValidatedData.title,
      type: completeValidatedData.type,
      authorId: userId,
    };

    const postData =
      completeValidatedData.type === "RESOURCE"
        ? {
            ...baseData,
            fileUrl: completeValidatedData.fileUrl,
            fileName: completeValidatedData.fileName,
            fileSize: completeValidatedData.fileSize,
            mimeType: completeValidatedData.mimeType,
            content: null,
          }
        : {
            ...baseData,
            content: completeValidatedData.content,
            fileUrl: null,
            fileName: null,
            fileSize: null,
            mimeType: null,
          };

    // Create the post
    const post = await tx.post.create({ data: postData });

    // Create PostTag relationships if tags are provided
    if (completeValidatedData.tagIds?.length > 0) {
      await tx.postTag.createMany({
        data: completeValidatedData.tagIds.map((tagId) => ({
          postId: post.id,
          tagId,
        })),
      });
    }

    // Fetch and return the complete post with all relations
    return await tx.post.findUnique({
      where: { id: post.id },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        createdAt: true,
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
        postTags: {
          include: { tag: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });
  });
};

export default handlePostCreation;
