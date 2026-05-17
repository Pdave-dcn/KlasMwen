import prisma from "../../../../core/config/db.js";
import { BaseSelectors } from "../types/commentTypes.js";

import type { Prisma } from "@prisma/client";

class CommentRepository {
  static findByUserWithRelations(
    userId: string,
    query: Prisma.CommentFindManyArgs,
  ) {
    return prisma.comment.findMany({
      ...query,
      where: { ...query.where, authorId: userId, hidden: false },
      include: BaseSelectors.commentRelations,
    });
  }

  static findParentCommentsByPost(
    postId: string,
    query: Prisma.CommentFindManyArgs,
  ) {
    return prisma.comment.findMany({
      ...query,
      where: { ...query.where, postId, parentId: null, hidden: false },
      select: BaseSelectors.comment,
    });
  }

  static countByPost(postId: string) {
    return prisma.comment.count({ where: { postId } });
  }

  static findRepliesByParent(
    parentId: number,
    query: Prisma.CommentFindManyArgs,
  ) {
    return prisma.comment.findMany({
      ...query,
      where: { ...query.where, parentId, hidden: false },
      orderBy: { createdAt: "asc" },
      select: BaseSelectors.reply,
    });
  }

  static findById(commentId: number) {
    return prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, parentId: true, authorId: true, postId: true },
    });
  }

  static async postExists(postId: string): Promise<boolean> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    return !!post;
  }

  static create(data: Prisma.CommentCreateInput) {
    return prisma.comment.create({ data });
  }

  static delete(commentId: number) {
    return prisma.comment.delete({ where: { id: commentId } });
  }
}

export { CommentRepository };
