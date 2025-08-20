import prisma from "../core/config/db.js";
import { handleError } from "../core/error/index";
import transformPostTagsToFlat from "../features/posts/postTagFlattener.js";
import { ensureAuthenticated } from "../utils/auth.util.js";
import {
  buildPaginatedQuery,
  processPaginatedResults,
  uuidPaginationSchema,
} from "../utils/pagination.util.js";
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

    return res.status(200).json({ data: user });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const user = ensureAuthenticated(req);

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
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getMyPosts = async (req: Request, res: Response) => {
  try {
    const user = ensureAuthenticated(req);

    const { limit, cursor } = uuidPaginationSchema.parse(req.query);

    const baseQuery = {
      where: { authorId: user.id },
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
      orderBy: { createdAt: "desc" as const },
    };

    const paginatedQuery = buildPaginatedQuery<"post">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
    });

    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany(paginatedQuery),
      prisma.post.count({
        where: { authorId: user.id },
      }),
    ]);

    const transformedPosts = posts.map(
      transformPostTagsToFlat as (post: Partial<RawPost>) => TransformedPost
    );

    const { data: postsData, pagination } = processPaginatedResults(
      transformedPosts,
      limit,
      "id"
    );

    return res.status(200).json({
      data: postsData,
      pagination: {
        hasMore: pagination.hasMore,
        nextCursor: pagination.nextCursor,
        totalPosts,
      },
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { getUserById, updateUserProfile, getMyPosts };
