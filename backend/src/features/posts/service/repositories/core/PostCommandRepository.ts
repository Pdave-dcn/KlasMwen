import prisma from "../../../../../core/config/db.js";
import { BaseSelectors, type CreatePostInput } from "../../types/postTypes.js";

/**
 * PostCommandRepository - Write operations only
 */
class PostCommandRepository {
  /**
   * Create a new post record within a single transactional operation
   */
  static async createPost(
    completeValidatedData: CreatePostInput,
    userId: string
  ) {
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
        select: BaseSelectors.extendedPost,
      });
    });
  }

  /**
   * Update a post with transaction support
   */
  static updatePost(
    postId: string,
    updateData: { title: string; content?: string },
    tagIds: number[]
  ) {
    return prisma.$transaction(async (tx) => {
      // Update post fields
      await tx.post.update({
        where: { id: postId },
        data: updateData,
      });

      // Replace tags
      await tx.postTag.deleteMany({
        where: { postId },
      });

      if (tagIds.length > 0) {
        await tx.postTag.createMany({
          data: tagIds.map((tagId) => ({
            postId,
            tagId,
          })),
        });
      }

      // Return updated post
      return tx.post.findUnique({
        where: { id: postId },
        select: BaseSelectors.post,
      });
    });
  }

  /**
   * Delete a post by ID
   */
  static async delete(postId: string) {
    return await prisma.post.delete({
      where: { id: postId },
    });
  }
}

export default PostCommandRepository;
