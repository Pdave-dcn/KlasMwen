import prisma from "../../../../../core/config/db.js";
import {
  BaseSelectors,
  type CreatePostInput,
  type ExtendedPost,
  type BasePost,
} from "../../types/postTypes.js";

import type { PrismaClient } from "@prisma/client";

interface IPostCommandRepository {
  createPost(
    completeValidatedData: CreatePostInput,
    userId: string,
  ): Promise<ExtendedPost | null>;
  updatePost(
    postId: string,
    updateData: { title: string; content?: string },
    tagIds: number[],
  ): Promise<BasePost | null>;
  delete(postId: string): Promise<unknown>;
}

class PostCommandRepository implements IPostCommandRepository {
  constructor(private client: PrismaClient) {}

  async createPost(completeValidatedData: CreatePostInput, userId: string) {
    return await this.client.$transaction(async (tx) => {
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

      const post = await tx.post.create({ data: postData });

      if (completeValidatedData.tagIds?.length > 0) {
        await tx.postTag.createMany({
          data: completeValidatedData.tagIds.map((tagId) => ({
            postId: post.id,
            tagId,
          })),
        });
      }

      return await tx.post.findUnique({
        where: { id: post.id },
        select: BaseSelectors.extendedPost,
      });
    });
  }

  updatePost(
    postId: string,
    updateData: { title: string; content?: string },
    tagIds: number[],
  ) {
    return this.client.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: postId },
        data: updateData,
      });

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

      return tx.post.findUnique({
        where: { id: postId },
        select: BaseSelectors.post,
      });
    });
  }

  async delete(postId: string) {
    return await this.client.post.delete({
      where: { id: postId },
    });
  }
}

const postCommandRepository = new PostCommandRepository(prisma);
export { postCommandRepository, type IPostCommandRepository };
