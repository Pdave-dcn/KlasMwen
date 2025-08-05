/* eslint-disable max-lines-per-function*/

import { PostType } from "@prisma/client";
import z from "zod";

import prisma from "../config/db";
import { handlePostWithCommentPagination } from "../lib/commentPaginationHandler";
import { handleError } from "../lib/errorHandler";
import transformPostTagsToFlat from "../lib/postTagFlattener";

import type { Request, Response } from "express";

const NewPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters long")
    .max(100, "Title must be 100 characters or fewer"),

  content: z
    .string()
    .trim()
    .min(10, "Content must be at least 10 characters")
    .max(10000, "Content can't exceed 10000 characters"),

  type: z.enum(Object.values(PostType)),

  tagIds: z
    .array(z.number().int().positive("Tag ID must be a positive integer"))
    .max(10, "Maximum 10 tags allowed")
    .optional()
    .default([]),
});

const PostIdParamSchema = z.object({
  id: z.uuid("Invalid post ID format in URL parameter."),
});

const EditPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters long")
    .max(200, "Title must be less than 200 characters"),

  content: z
    .string()
    .trim()
    .min(1, "Content is required")
    .max(10000, "Content must be less than 10000 characters"),

  type: z.enum(Object.values(PostType) as [PostType, ...PostType[]]),
});

// TODO: handle file upload
const createPost = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validatedBody = NewPostSchema.parse(req.body);

    // Use transaction to create post and tags together
    const result = await prisma.$transaction(async (tx) => {
      //  Create the post first
      const post = await tx.post.create({
        data: {
          title: validatedBody.title,
          content: validatedBody.content,
          type: validatedBody.type,
          authorId: user.id,
        },
      });

      //  Create PostTag relationships if tags are provided
      if (validatedBody.tagIds && validatedBody.tagIds.length > 0) {
        await tx.postTag.createMany({
          data: validatedBody.tagIds.map((tagId) => ({
            postId: post.id,
            tagId,
          })),
        });
      }

      // 3. Return the post with all relations for response
      return await tx.post.findUnique({
        where: { id: post.id },
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
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
      });
    });

    if (!result) {
      return res
        .status(500)
        .json({ message: "Unexpected error: post creation failed." });
    }
    const transformedPost = transformPostTagsToFlat(result);

    return res.status(201).json({
      message: "Post create successfully",
      post: transformedPost,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getAllPosts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const skip = (page - 1) * pageSize;

    const posts = await prisma.post.findMany({
      skip,
      take: pageSize,
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        postTags: { include: { tag: true } },
        _count: { select: { comments: true, likes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const transformedPosts = posts.map(transformPostTagsToFlat);

    return res.status(200).json(transformedPosts);
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getPostById = async (req: Request, res: Response) => {
  try {
    const { id: postId } = PostIdParamSchema.parse(req.params);

    const commentLimit = parseInt(req.query.commentLimit as string) || 20;
    const commentCursor = req.query.commentCursor as string;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
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
          take: commentLimit + 1,
          ...(commentCursor && {
            cursor: { id: parseInt(commentCursor) },
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

    const transformedPost = handlePostWithCommentPagination(post, commentLimit);

    return res.status(200).json(transformedPost);
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

// TODO: handle file specifics
const editPost = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(409).json({ message: "Unauthorized" });

    const { id: postId } = PostIdParamSchema.parse(req.params);
    const updateData = EditPostSchema.parse(req.body);

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (user.id !== post.authorId)
      return res.status(409).json({ message: "Unauthorized" });

    const editedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title: updateData.title,
        content: updateData.content,
        type: updateData.type,
      },
    });

    return res.status(200).json({
      message: "Post update successfully",
      post: editedPost,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const deletePost = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(409).json({ message: "Unauthorized" });

    const { id: postId } = PostIdParamSchema.parse(req.params);

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (user.id !== post.authorId || user.role !== "ADMIN")
      return res.status(409).json({ message: "Unauthorized" });

    await prisma.post.delete({
      where: { id: postId },
    });

    return res.status(200).json({ message: "Post delete successfully" });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { createPost, getAllPosts, getPostById, editPost, deletePost };
