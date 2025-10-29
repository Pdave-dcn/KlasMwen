import axios from "axios";

import { createLogger } from "../../core/config/logger";
import { handleError } from "../../core/error";
import createEditResponse from "../../features/posts/createEditResponse";
import transformPostTagsToFlat from "../../features/posts/postTagFlattener";
import PostService from "../../features/posts/service/PostService";
import {
  checkAdminAuth,
  checkPermission,
  ensureAuthenticated,
} from "../../utils/auth.util";
import createActionLogger from "../../utils/logger.util";
import { uuidPaginationSchema } from "../../utils/pagination.util";
import { PostIdParamSchema } from "../../zodSchemas/post.zod";

import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "PostController" });

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

/* eslint-disable-next-line max-lines-per-function */
const downloadResource = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "downloadResource",
    req
  );

  try {
    actionLogger.info("Downloading post resource");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);
    const { id: postId } = PostIdParamSchema.parse(req.params);
    actionLogger.info(
      { userId: user.id, postId },
      "User authenticated and post ID parsed"
    );

    const serviceStartTime = Date.now();
    const resource = await PostService.getResourcePostById(postId);
    const serviceDuration = Date.now() - serviceStartTime;

    actionLogger.debug(
      { fileUrl: resource.fileUrl },
      "Fetching file from Cloudinary"
    );
    const fileResponse = await axios({
      method: "GET",
      url: resource.fileUrl as string,
      responseType: "stream",
      timeout: 0,
    });

    const fileSize = parseInt(
      fileResponse.headers["content-length"] ?? "0",
      10
    );
    const mimeType = resource.mimeType ?? fileResponse.headers["content-type"];
    const fileName = resource.fileName ?? "file";

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", mimeType);
    if (fileSize > 0) res.setHeader("Content-Length", fileSize);

    fileResponse.data.on("error", (err: Error) => {
      actionLogger.error(
        { err, postId },
        "Error while streaming file from Cloudinary"
      );
      if (!res.headersSent) res.status(500).send("Error streaming file");
      res.destroy(err);
    });

    req.on("close", () => {
      if (!res.writableEnded) {
        actionLogger.warn({ postId, userId: user.id }, "User aborted download");
        fileResponse.data.destroy();
      }
    });

    fileResponse.data.pipe(res).on("end", () => {
      actionLogger.info(
        {
          postId: resource.id,
          userId: user.id,
          fileSize,
          totalDuration: Date.now() - startTime,
          serviceDuration,
        },
        "Post resource streamed successfully"
      );
    });

    return;
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

export {
  getAllPosts,
  getPostById,
  getPostForEdit,
  getPostMetadata,
  downloadResource,
};
