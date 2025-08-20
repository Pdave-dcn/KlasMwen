import { Prisma } from "@prisma/client";

import prisma from "../core/config/db.js";
import { handleError } from "../core/error/index.js";
import transformPostTagsToFlat from "../features/posts/postTagFlattener";
import { ensureAuthenticated } from "../utils/auth.util.js";
import {
  buildCompoundCursorQuery,
  processPaginatedResults,
  uuidPaginationSchema,
} from "../utils/pagination.util.js";
import { PostIdParamSchema } from "../zodSchemas/post.zod.js";

import type { RawPost, TransformedPost } from "../types/postTypes";
import type { Request, Response } from "express";

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

    const { limit, cursor } = uuidPaginationSchema.parse(req.query);

    const baseQuery: Prisma.BookmarkFindManyArgs = {
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      ...bookmarkWithPost,
    };

    const queryOptions = buildCompoundCursorQuery<"bookmark">(baseQuery, {
      cursor,
      limit,
      cursorFields: cursor
        ? { userId_postId: { userId: user.id, postId: cursor } }
        : {},
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const bookmarks = (await prisma.bookmark.findMany(
      queryOptions
    )) as BookmarkWithPost[];

    const posts = bookmarks.map((bookmark) => bookmark.post);
    const transformedPosts = posts.map(
      transformPostTagsToFlat as (post: Partial<RawPost>) => TransformedPost
    );

    const result = processPaginatedResults(transformedPosts, limit);

    return res.status(200).json(result);
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
