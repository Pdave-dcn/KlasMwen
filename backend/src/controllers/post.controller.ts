import prisma from "../core/config/db.js";
import { handleError } from "../core/error/index";
import { handlePostWithCommentPagination } from "../features/comments/commentPaginationHandler.js";
import {
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "../features/media/cloudinaryServices.js";
import createEditResponse from "../features/posts/createEditResponse.js";
import handlePostCreation from "../features/posts/postCreationHandler.js";
import transformPostTagsToFlat from "../features/posts/postTagFlattener.js";
import handlePostUpdate from "../features/posts/postUpdateHandler.js";
import handleRequestValidation from "../features/posts/requestPostParser.js";
import {
  checkAdminAuth,
  checkPermission,
  ensureAuthenticated,
} from "../utils/auth.util.js";
import {
  PostIdParamSchema,
  UpdatedPostSchema,
} from "../zodSchemas/post.zod.js";

import type { RawPost, TransformedPost } from "../types/postTypes.js";
import type { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

const createPost = async (req: Request, res: Response) => {
  try {
    const user = ensureAuthenticated(req);

    const { completeValidatedData, uploadedFileInfo } =
      await handleRequestValidation(req, user.id);

    const result = await handlePostCreation(completeValidatedData, user.id);

    if (!result) {
      // If database operation failed but file was uploaded, clean up
      if (uploadedFileInfo) {
        try {
          await deleteFromCloudinary(uploadedFileInfo.publicId, "raw");
        } catch (cleanupError) {
          console.error("Failed to cleanup uploaded file:", cleanupError);
        }
      }
      return res
        .status(500)
        .json({ message: "Unexpected error: post creation failed." });
    }
    const transformedPost = transformPostTagsToFlat(result);

    return res.status(201).json({
      message: "Post created successfully",
      data: transformedPost,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getAllPosts = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const cursor = req.query.cursor as string | undefined;

    const queryOptions: Prisma.PostFindManyArgs = {
      take: limit + 1,
      orderBy: { createdAt: "desc" },
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
    };

    if (cursor) {
      const validatedCursor = PostIdParamSchema.parse(cursor);
      queryOptions.cursor = { id: validatedCursor.id };
      queryOptions.skip = 1;
    }

    const posts = await prisma.post.findMany(queryOptions);

    const hasMore = posts.length > limit;
    const postsSlice = posts.slice(0, limit);
    const nextCursor = hasMore ? postsSlice[postsSlice.length - 1].id : null;

    const transformedPosts = postsSlice.map(
      transformPostTagsToFlat as (post: Partial<RawPost>) => TransformedPost
    );

    return res.status(200).json({
      data: transformedPosts,
      pagination: {
        hasMore,
        nextCursor,
      },
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getPostById = async (req: Request, res: Response) => {
  try {
    const { id: postId } = PostIdParamSchema.parse(req.params);

    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
        postTags: {
          include: { tag: true },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: "asc" },
          take: limit + 1,
          ...(cursor && {
            cursor: { id: parseInt(cursor) },
            skip: 1,
          }),
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const transformedPost = handlePostWithCommentPagination(post, limit);

    return res.status(200).json({ data: transformedPost });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getPostForEdit = async (req: Request, res: Response) => {
  try {
    const user = ensureAuthenticated(req);

    const { id: postId } = PostIdParamSchema.parse(req.params);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        createdAt: true,
        updatedAt: true,
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
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    checkPermission(user, post, false);

    const transformedPost = transformPostTagsToFlat(post);

    const editData = createEditResponse(transformedPost);

    return res.status(200).json({
      data: editData,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

//* Disposable
const getPostMetadata = async (req: Request, res: Response) => {
  try {
    if (!checkAdminAuth(req.user)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { id: postId } = PostIdParamSchema.parse(req.params);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        type: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        author: {
          select: { id: true, username: true, email: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.status(200).json({ data: post });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const updatePost = async (req: Request, res: Response) => {
  try {
    const user = ensureAuthenticated(req);

    const { id: postId } = PostIdParamSchema.parse(req.params);
    const validatedData = UpdatedPostSchema.parse({
      title: req.body.title,
      type: req.body.type,
      content: req.body.content,
      tagIds: req.body.tagIds ? JSON.parse(req.body.tagIds) : [],
    });

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });

    checkPermission(user, post, false);

    const result = await handlePostUpdate(validatedData, post.id);

    if (!result) {
      return res
        .status(400)
        .json({ message: "Unexpected error: post update failed." });
    }

    return res.status(200).json({
      message: "Post updated successfully",
      data: result,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const deletePost = async (req: Request, res: Response) => {
  try {
    const user = ensureAuthenticated(req);

    const { id: postId } = PostIdParamSchema.parse(req.params);

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });

    checkPermission(user, post);

    if (post.type === "RESOURCE" && post.fileUrl) {
      try {
        const publicId = extractPublicIdFromUrl(post.fileUrl);
        if (publicId) {
          await deleteFromCloudinary(publicId, "raw");
        }
      } catch (cleanupError) {
        console.error("Failed to cleanup Cloudinary file:", cleanupError);
        // Don't fail the entire operation if cleanup fails
      }
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getPostForEdit,
  getPostMetadata,
};
