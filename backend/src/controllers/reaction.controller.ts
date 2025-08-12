import prisma from "../core/config/db.js";
import { handleError } from "../core/error/index";
import { PostIdParamSchema } from "../zodSchemas/post.zod.js";

import type { Request, Response } from "express";

const toggleLike = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const userId = user.id;

    const { id: postId } = PostIdParamSchema.parse(req.params);

    const [existingPost, existingLike] = await Promise.all([
      prisma.post.findUnique({ where: { id: postId } }),
      prisma.like.findUnique({
        where: { userId_postId: { userId, postId } },
      }),
    ]);

    if (!existingPost) {
      return res
        .status(404)
        .json({ message: "The post being reacted to is not found" });
    }

    if (existingLike) {
      await prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      });
      return res.status(200).json({
        message: "Post unliked successfully",
      });
    }

    await prisma.like.create({
      data: { userId, postId },
    });
    return res.status(200).json({
      message: "Post liked successfully",
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { toggleLike };
