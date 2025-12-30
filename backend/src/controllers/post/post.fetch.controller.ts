import axios from "axios";

import { createLogger } from "../../core/config/logger.js";
import { handleError } from "../../core/error/index.js";
import PostService from "../../features/posts/service/PostService.js";
import createActionLogger from "../../utils/logger.util.js";
import { uuidPaginationSchema } from "../../utils/pagination.util.js";
import { PostIdParamSchema } from "../../zodSchemas/post.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";
import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "PostController" });

const getAllPosts = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "getAllPosts", req);

  try {
    actionLogger.info("Fetching all posts");
    const startTime = Date.now();

    const { user } = req as AuthenticatedRequest;

    const { limit, cursor } = uuidPaginationSchema.parse(req.query);

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

    const { user } = req as AuthenticatedRequest;

    const { id: postId } = PostIdParamSchema.parse(req.params);

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

    const { user } = req as AuthenticatedRequest;
    const { id: postId } = PostIdParamSchema.parse(req.params);

    actionLogger.debug("Processing user post fetch request");
    const serviceStartTime = Date.now();
    const post = await PostService.getPostForEdit(user, postId);
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        postId: post.id,
        userId: user.id,
        serviceDuration,
        totalDuration,
      },
      "Post for edit retrieved successfully"
    );

    return res.status(200).json({ data: post });
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

    const { user } = req as AuthenticatedRequest;

    const { id: postId } = PostIdParamSchema.parse(req.params);

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

export { getAllPosts, getPostById, getPostForEdit, downloadResource };
