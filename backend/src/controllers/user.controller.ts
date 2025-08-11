import prisma from "../core/config/db.js";
import { handleError } from "../core/error/index.js";
import transformPostTagsToFlat from "../features/posts/postTagFlattener.js";
import {
  UpdateUserProfileSchema,
  UserIdParamSchema,
} from "../zodSchemas/user.zod.js";

import type { RawPost, TransformedPost } from "../types/postTypes.js";
import type { Response, Request } from "express";

const getUserById = async (req: Request, res: Response) => {
  try {
    const { id: userId } = UserIdParamSchema.parse(req.params);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json(user);
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { bio, avatarUrl } = UpdateUserProfileSchema.parse(req.body);

    const isExist = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!isExist) return res.status(404).json({ message: "User not found" });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { bio, avatarUrl },
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        role: true,
      },
    });

    return res.json({
      message: "Profile update successfully",
      user: updatedUser,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getMyPosts = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const postLimit = parseInt(req.query.postLimit as string) || 10;
    const postCursor = req.query.postCursor as string;

    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: user.id },
        take: postLimit + 1,
        ...(postCursor && {
          cursor: { id: postCursor },
          skip: 1,
        }),
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          fileUrl: true,
          fileName: true,
          createdAt: true,
          postTags: {
            include: { tag: true },
          },
          _count: {
            select: { comments: true, likes: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.post.count({
        where: { authorId: user.id },
      }),
    ]);

    const transformedPosts = posts.map(
      transformPostTagsToFlat as (post: Partial<RawPost>) => TransformedPost
    );

    const hasNextPage = transformedPosts.length > postLimit;
    const postsSlice = hasNextPage
      ? transformedPosts.slice(0, postLimit)
      : transformedPosts;

    const nextCursor = hasNextPage ? transformedPosts[postLimit - 1].id : null;

    return res.status(200).json({ posts: postsSlice, nextCursor, totalPosts });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { getUserById, updateUserProfile, getMyPosts };
