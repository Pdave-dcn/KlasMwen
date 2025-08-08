import prisma from "../../core/config/db.js";

import type { RawPost } from "../../types/postTypes.js";

type ValidatedData =
  | {
      title: string;
      tagIds: number[];
      type: "QUESTION" | "NOTE";
      content: string;
    }
  | {
      title: string;
      tagIds: number[];
      type: "RESOURCE";
      fileName: string;
    };

/**
 * Updates a post and its associated tags in the database.
 *
 * Handles different update fields based on post type (content for text posts,
 * fileName for resources) and replaces existing tags with new ones. Uses a
 * transaction to ensure atomicity of all updates.
 *
 * @param {ValidatedData} validatedData - Validated update data with type-specific fields
 * @param {string} postId - ID of the post to update
 * @returns {Promise<RawPost | null>} - Updated post with author, tags, and counts, or null if not found
 */
const handlePostUpdate = async (
  validatedData: ValidatedData,
  postId: string
): Promise<RawPost | null> => {
  return await prisma.$transaction(async (tx) => {
    // Update post fields based on type
    const updateData =
      validatedData.type === "RESOURCE"
        ? { title: validatedData.title, fileName: validatedData.fileName }
        : { title: validatedData.title, content: validatedData.content };

    await tx.post.update({
      where: { id: postId },
      data: updateData,
    });

    // Replace existing tags with new ones by first deleting all old tags
    // and then creating the new ones.
    await tx.postTag.deleteMany({
      where: { postId },
    });

    // Only create new tags if there are any to add
    if (validatedData.tagIds?.length > 0) {
      await tx.postTag.createMany({
        data: validatedData.tagIds.map((tagId) => ({
          postId,
          tagId,
        })),
      });
    }

    // Return updated post with all relations
    return await tx.post.findUnique({
      where: { id: postId },
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
        updatedAt: true,
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

export default handlePostUpdate;
