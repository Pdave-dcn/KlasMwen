import prisma from "../../../../../core/config/db.js";

import type { Prisma, PrismaClient } from "@prisma/client";

interface IPostValidationRepository {
  exists(postId: string): Promise<Prisma.PostGetPayload<{
    select: {
      id: true;
      authorId: true;
      type: true;
      fileUrl: true;
      createdAt: true;
    };
  }> | null>;
}

class PostValidationRepository implements IPostValidationRepository {
  constructor(private client: PrismaClient) {}

  async exists(postId: string): Promise<Prisma.PostGetPayload<{
    select: {
      id: true;
      authorId: true;
      type: true;
      fileUrl: true;
      createdAt: true;
    };
  }> | null> {
    const post = await this.client.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        type: true,
        fileUrl: true,
        createdAt: true,
      },
    });
    return post;
  }
}

const postValidationRepository = new PostValidationRepository(prisma);
export { postValidationRepository, type IPostValidationRepository };
