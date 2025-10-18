/* eslint-disable max-lines-per-function*/
import prisma from "../core/config/db.js";
import { createLogger } from "../core/config/logger.js";
import { handleError } from "../core/error/index";
import {
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "../features/media/cloudinaryServices.js";
import createEditResponse from "../features/posts/createEditResponse.js";
import handlePostCreation from "../features/posts/postCreationHandler.js";
import transformPostTagsToFlat from "../features/posts/postTagFlattener.js";
import handleRequestValidation from "../features/posts/requestPostParser.js";
import PostService from "../features/posts/service/PostService.js";
import {
  checkAdminAuth,
  checkPermission,
  ensureAuthenticated,
} from "../utils/auth.util.js";
import createActionLogger from "../utils/logger.util.js";
import { uuidPaginationSchema } from "../utils/pagination.util.js";
import {
  PostIdParamSchema,
  UpdatedPostSchema,
} from "../zodSchemas/post.zod.js";

import type { RawPost } from "../types/postTypes.js";
import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "PostController" });

const createPost = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "createPost", req);

  try {
    actionLogger.info("Post creation attempt started");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);
    actionLogger.info(
      { userId: user.id, username: user.username },
      "User authenticated for post creation"
    );

    actionLogger.debug("Validating request and processing file upload");
    const validationStartTime = Date.now();
    const { completeValidatedData, uploadedFileInfo } =
      await handleRequestValidation(req, user.id);
    const validationDuration = Date.now() - validationStartTime;

    actionLogger.info(
      {
        postType: completeValidatedData.type,
        hasFile: !!uploadedFileInfo,
        tagCount: completeValidatedData.tagIds?.length || 0,
        validationDuration,
      },
      "Request validation completed"
    );

    actionLogger.debug("Creating post in database");
    const dbStartTime = Date.now();
    const result = await handlePostCreation(completeValidatedData, user.id);
    const dbDuration = Date.now() - dbStartTime;

    if (!result) {
      // If database operation failed but file was uploaded, clean up
      if (uploadedFileInfo) {
        actionLogger.warn(
          {
            publicId: uploadedFileInfo.publicId,
          },
          "Post creation failed, cleaning up uploaded file"
        );
        try {
          await deleteFromCloudinary(uploadedFileInfo.publicId, "raw");
          actionLogger.info("Cleanup of uploaded file completed");
        } catch (cleanupError) {
          actionLogger.error(
            {
              errorType:
                cleanupError instanceof Error
                  ? cleanupError.constructor.name
                  : typeof cleanupError,
              errorDescription:
                cleanupError instanceof Error
                  ? cleanupError.message
                  : String(cleanupError),
              filePublicId: uploadedFileInfo.publicId,
            },
            "Failed to cleanup uploaded file"
          );
        }
      }

      const totalDuration = Date.now() - startTime;
      actionLogger.error(
        { dbDuration, totalDuration },
        "Post creation failed - database operation returned null"
      );

      return res
        .status(500)
        .json({ message: "Unexpected error: post creation failed." });
    }

    const transformedPost = transformPostTagsToFlat(result as RawPost);
    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        postId: result.id,
        postType: result.type,
        userId: user.id,
        username: user.username,
        hasFile: !!uploadedFileInfo,
        tagCount: completeValidatedData.tagIds?.length || 0,
        dbDuration,
        totalDuration,
      },
      "Post created successfully"
    );

    return res.status(201).json({
      message: "Post created successfully",
      data: transformedPost,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getAllPosts = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "getAllPosts", req);

  try {
    actionLogger.info("Fetching all posts");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);
    actionLogger.info(
      { userId: user.id, username: user.username },
      "User authenticated for post update"
    );

    const { limit, cursor } = uuidPaginationSchema.parse(req.query);
    actionLogger.debug(
      { limit, cursor, hasCursor: !!cursor },
      "Pagination parameters parsed"
    );

    actionLogger.debug("Processing user posts request");
    const serviceStartTime = Date.now();
    const result = await PostService.getAllPosts(
      user.id,
      limit,
      cursor as string | undefined
    );
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        totalPosts: result.posts.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        serviceDuration,
        totalDuration,
      },
      "All posts fetched successfully"
    );

    return res.status(200).json({
      data: result.posts,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getPostById = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "getPostById", req);

  try {
    actionLogger.info("Fetching post by ID");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);
    actionLogger.info(
      { userId: user.id, username: user.username },
      "User authenticated for post update"
    );

    const { id: postId } = PostIdParamSchema.parse(req.params);

    actionLogger.debug(
      {
        postId,
      },
      "Parameter parsed"
    );

    actionLogger.debug("Processing user post fetching by ID request");
    const serviceStartTime = Date.now();
    const post = await PostService.getPostById(postId, user.id);
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        postId: post.id,
        postType: post.type,
        serviceDuration,
        totalDuration,
      },
      "Post retrieved successfully"
    );

    return res.status(200).json({ data: post });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getPostForEdit = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getPostForEdit",
    req
  );

  try {
    actionLogger.info("Fetching post for edit");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);
    const { id: postId } = PostIdParamSchema.parse(req.params);

    actionLogger.info(
      {
        userId: user.id,
        username: user.username,
        postId,
      },
      "User authenticated and post ID parsed"
    );

    actionLogger.debug("Processing user post fetch request");
    const serviceStartTime = Date.now();
    const post = await PostService.getPostForEdit(postId);
    const serviceDuration = Date.now() - serviceStartTime;

    actionLogger.info(
      {
        postId: post.id,
        postAuthorId: post.author.id,
        requestUserId: user.id,
        postType: post.type,
        serviceDuration,
      },
      "Post found, checking permissions"
    );

    checkPermission(user, post, false);

    const transformedPost = transformPostTagsToFlat(post);
    const editData = createEditResponse(transformedPost);

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        postId: post.id,
        userId: user.id,
        postType: post.type,
        serviceDuration,
        totalDuration,
      },
      "Post for edit retrieved successfully"
    );

    return res.status(200).json({ data: editData });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getPostMetadata = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getPostMetadata",
    req
  );

  try {
    actionLogger.info("Fetching post metadata (admin only)");
    const startTime = Date.now();

    if (!checkAdminAuth(req.user)) {
      actionLogger.warn(
        { userId: req.user?.id, userRole: req.user?.role },
        "Non-admin user attempted to access post metadata"
      );
      return res.status(403).json({ message: "Admin access required" });
    }

    actionLogger.info({ adminUserId: req.user?.id }, "Admin access verified");

    const { id: postId } = PostIdParamSchema.parse(req.params);
    actionLogger.debug({ postId }, "Post ID parameter parsed");

    actionLogger.debug("Processing user post metadata request");
    const serviceStartTime = Date.now();
    const post = await PostService.getPostMetadata(postId);
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        postId: post.id,
        postType: post.type,
        authorId: post.authorId,
        authorEmail: post.author.email,
        adminUserId: req.user?.id,
        serviceDuration,
        totalDuration,
      },
      "Post metadata retrieved successfully"
    );

    return res.status(200).json({ data: post });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const updatePost = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "updatePost", req);
  try {
    actionLogger.info("Post update attempt started");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);
    actionLogger.info(
      { userId: user.id, username: user.username },
      "User authenticated for post update"
    );

    const { id: postId } = PostIdParamSchema.parse(req.params);
    actionLogger.debug({ postId }, "Post ID parameter parsed");

    const validatedData = UpdatedPostSchema.parse({
      title: req.body.title,
      type: req.body.type,
      tagIds: req.body.tagIds,
      ...(req.body.content !== undefined && { content: req.body.content }),
      ...(req.body.fileName !== undefined && { fileName: req.body.fileName }),
    });

    actionLogger.info(
      {
        postId,
        postType: validatedData.type,
        tagCount: validatedData.tagIds?.length || 0,
      },
      "Update data validated"
    );

    actionLogger.debug("Fetching post for update");
    const dbLookupStartTime = Date.now();
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });
    const dbLookupDuration = Date.now() - dbLookupStartTime;

    if (!post) {
      actionLogger.warn(
        { postId, userId: user.id, dbLookupDuration },
        "Post not found for update"
      );
      return res.status(404).json({ message: "Post not found" });
    }

    actionLogger.info(
      {
        postId: post.id,
        postAuthorId: post.authorId,
        requestUserId: user.id,
        dbLookupDuration,
      },
      "Post found, checking permissions"
    );

    checkPermission(user, post, false);
    actionLogger.debug("Permission check passed");

    actionLogger.debug("Executing post update");
    const dbUpdateStartTime = Date.now();
    const result = await PostService.handlePostUpdate(validatedData, post.id);
    const dbUpdateDuration = Date.now() - dbUpdateStartTime;

    if (!result) {
      const totalDuration = Date.now() - startTime;
      actionLogger.error(
        {
          postId,
          userId: user.id,
          dbLookupDuration,
          dbUpdateDuration,
          totalDuration,
        },
        "Post update failed - update handler returned null"
      );
      return res
        .status(400)
        .json({ message: "Unexpected error: post update failed." });
    }
    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        postId: result.id,
        userId: user.id,
        username: user.username,
        postType: validatedData.type,
        tagCount: validatedData.tagIds?.length || 0,
        dbLookupDuration,
        dbUpdateDuration,
        totalDuration,
      },
      "Post updated successfully"
    );

    return res.status(200).json({
      message: "Post updated successfully",
      data: result,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const deletePost = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "deletePost", req);

  try {
    actionLogger.info("Post deletion attempt started");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);
    actionLogger.info(
      { userId: user.id, username: user.username },
      "User authenticated for post deletion"
    );

    const { id: postId } = PostIdParamSchema.parse(req.params);
    actionLogger.debug({ postId }, "Post ID parameter parsed");

    actionLogger.debug("Fetching post for deletion");
    const dbLookupStartTime = Date.now();
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });
    const dbLookupDuration = Date.now() - dbLookupStartTime;

    if (!post) {
      actionLogger.warn(
        { postId, userId: user.id, dbLookupDuration },
        "Post not found for deletion"
      );
      return res.status(404).json({ message: "Post not found" });
    }

    actionLogger.info(
      {
        postId: post.id,
        postType: post.type,
        postAuthorId: post.authorId,
        requestUserId: user.id,
        hasFile: !!post.fileUrl,
        fileName: post.fileName,
        dbLookupDuration,
      },
      "Post found, checking permissions"
    );

    checkPermission(user, post);
    actionLogger.debug("Permission check passed");

    // Handle file cleanup if it's a RESOURCE post with a file
    let cleanupDuration = 0;
    if (post.type === "RESOURCE" && post.fileUrl) {
      actionLogger.debug(
        { fileUrl: post.fileUrl, fileName: post.fileName },
        "Resource post with file detected, initiating cleanup"
      );

      const cleanupStartTime = Date.now();
      try {
        const publicId = extractPublicIdFromUrl(post.fileUrl);
        if (publicId) {
          actionLogger.debug(
            { publicId },
            "Extracted public ID, deleting from Cloudinary"
          );
          await deleteFromCloudinary(publicId, "raw");
          cleanupDuration = Date.now() - cleanupStartTime;
          actionLogger.info(
            { publicId, fileName: post.fileName, cleanupDuration },
            "File deleted from Cloudinary successfully"
          );
        } else {
          actionLogger.warn(
            { fileUrl: post.fileUrl },
            "Could not extract public ID from file URL"
          );
        }
      } catch (cleanupError) {
        cleanupDuration = Date.now() - cleanupStartTime;
        actionLogger.error(
          {
            errorType:
              cleanupError instanceof Error
                ? cleanupError.constructor.name
                : typeof cleanupError,
            errorDescription:
              cleanupError instanceof Error
                ? cleanupError.message
                : String(cleanupError),
            fileUrl: post.fileUrl,
            fileName: post.fileName,
            cleanupDuration,
          },
          "Failed to cleanup Cloudinary file - continuing with post deletion"
        );
      }
    }

    actionLogger.debug("Deleting post from database");
    const dbDeleteStartTime = Date.now();
    await prisma.post.delete({
      where: { id: postId },
    });
    const dbDeleteDuration = Date.now() - dbDeleteStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        postId,
        postType: post.type,
        userId: user.id,
        username: user.username,
        hadFile: !!post.fileUrl,
        fileName: post.fileName,
        dbLookupDuration,
        cleanupDuration,
        dbDeleteDuration,
        totalDuration,
      },
      "Post deleted successfully"
    );

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
