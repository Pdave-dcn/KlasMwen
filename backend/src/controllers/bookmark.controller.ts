import { Prisma } from "@prisma/client";
import { z } from "zod";

import prisma from "../core/config/db.js";
import { handleError } from "../core/error/index.js";
import transformPostTagsToFlat from "../features/posts/postTagFlattener";
import { ensureAuthenticated } from "../utils/auth.util.js";
import { PostIdParamSchema } from "../zodSchemas/post.zod.js";

import type { RawPost, TransformedPost } from "../types/postTypes";
import type { Request, Response } from "express";

const getBookmarksSchema = z.object({
  limit: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => !isNaN(val), { message: "limit must be a number" })
    .refine((val) => val > 0 && val <= 50, {
      message: "limit must be between 1 and 50",
    }),

  cursor: z.uuid().optional(),
});

const bookmarkWithPost = Prisma.validator<Prisma.BookmarkFindManyArgs>()({
  include: {
    post: {
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        fileUrl: true,
        fileName: true,
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
    },
  },
});

type BookmarkWithPost = Prisma.BookmarkGetPayload<typeof bookmarkWithPost>;

const getBookmarks = async (req: Request, res: Response) => {
  try {
    const user = ensureAuthenticated(req);

    const parsedQuery = getBookmarksSchema.parse(req.query);
    const { limit, cursor } = parsedQuery;

    const queryOptions: Prisma.BookmarkFindManyArgs = {
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      ...bookmarkWithPost,
      take: limit + 1,
    };

    if (cursor) {
      queryOptions.cursor = {
        userId_postId: { userId: user.id, postId: cursor },
      };
      queryOptions.skip = 1;
    }

    const bookmarks = (await prisma.bookmark.findMany(
      queryOptions
    )) as BookmarkWithPost[];

    const hasMore = bookmarks.length > limit;
    const bookmarksSlice = bookmarks.slice(0, limit);

    const posts = bookmarksSlice.map((bookmark) => bookmark.post);
    const transformedPosts = posts.map(
      transformPostTagsToFlat as (post: Partial<RawPost>) => TransformedPost
    );

    return res.status(200).json({
      data: transformedPosts,
      pagination: {
        hasMore,
        nextCursor: hasMore
          ? transformedPosts[transformedPosts.length - 1].id
          : null,
      },
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const createBookmark = async (req: Request, res: Response) => {
  try {
    const user = ensureAuthenticated(req);
    const userId = user.id;

    const { id: postId } = PostIdParamSchema.parse(req.params);

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    await prisma.bookmark.create({
      data: { userId, postId },
    });

    return res.status(201).json({
      message: "Post bookmarked successfully",
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const deleteBookmark = async (req: Request, res: Response) => {
  try {
    const user = ensureAuthenticated(req);
    const userId = user.id;

    const { id: postId } = PostIdParamSchema.parse(req.params);

    const existingBookmark = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (!existingBookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }

    await prisma.bookmark.delete({
      where: { userId_postId: { userId, postId } },
    });

    return res.status(200).json({
      message: "Bookmark removed successfully",
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { getBookmarks, createBookmark, deleteBookmark };
