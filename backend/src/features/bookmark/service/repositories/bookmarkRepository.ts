import prisma from "../../../../core/config/db.js";
import { BaseSelectors } from "../types/bookmarkTypes.js";

export class BookmarkRepository {
  static async findByUserAndPost(userId: string, postId: string) {
    return await prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
      select: BaseSelectors.bookmark,
    });
  }

  static async create(userId: string, postId: string) {
    return await prisma.bookmark.create({
      data: { userId, postId },
      select: BaseSelectors.bookmark,
    });
  }

  static async delete(userId: string, postId: string) {
    return await prisma.bookmark.delete({
      where: { userId_postId: { userId, postId } },
    });
  }
}
