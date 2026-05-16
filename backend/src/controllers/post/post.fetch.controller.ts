import axios from "axios";

import { createLogger } from "../../core/config/logger.js";
import { postService } from "../../features/posts/service/PostService.js";
import { withLogging } from "../../utils/logger.util.js";
import { uuidPaginationSchema } from "../../utils/pagination.util.js";
import { PostIdParamSchema } from "../../zodSchemas/post.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";

const controllerLogger = createLogger({ module: "PostController" });

const getAllPosts = withLogging<AuthenticatedRequest>(
  controllerLogger, "getAllPosts",
  async ({ req, res, log }) => {
    log.info("Fetching all posts");

    const { limit, cursor } = uuidPaginationSchema.parse(req.query);

    log.debug("Processing user posts request");
    const result = await postService.query.getAllPosts(
      req.user.id,
      limit,
      cursor as string | undefined,
    );

    log.info(
      {
        totalPosts: result.posts.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "All posts fetched successfully",
    );

    res.status(200).json({
      data: result.posts,
      pagination: result.pagination,
    });
  },
);

const getPostById = withLogging<AuthenticatedRequest>(
  controllerLogger, "getPostById",
  async ({ req, res, log }) => {
    log.info("Fetching post by ID");

    const { id: postId } = PostIdParamSchema.parse(req.params);

    log.debug("Processing user post fetching by ID request");
    const post = await postService.query.getPostById(postId, req.user.id);

    log.info(
      {
        postId: post.id,
        postType: post.type,
      },
      "Post retrieved successfully",
    );

    res.status(200).json({ data: post });
  },
);

const getPostForEdit = withLogging<AuthenticatedRequest>(
  controllerLogger, "getPostForEdit",
  async ({ req, res, log }) => {
    log.info("Fetching post for edit");

    const { id: postId } = PostIdParamSchema.parse(req.params);

    log.debug("Processing user post fetch request");
    const post = await postService.command.getPostForEdit(req.user, postId);

    log.info(
      {
        postId: post.id,
        userId: req.user.id,
      },
      "Post for edit retrieved successfully",
    );

    res.status(200).json({ data: post });
  },
);

const downloadResource = withLogging<AuthenticatedRequest>(
  controllerLogger, "downloadResource",
  async ({ req, res, log }) => {
    log.info("Downloading post resource");

    const { id: postId } = PostIdParamSchema.parse(req.params);

    const resource = await postService.query.getResourcePostById(postId);

    log.debug(
      { fileUrl: resource.fileUrl },
      "Fetching file from Cloudinary",
    );
    const fileResponse = await axios({
      method: "GET",
      url: resource.fileUrl as string,
      responseType: "stream",
      timeout: 0,
    });

    const fileSize = parseInt(
      (fileResponse.headers["content-length"] as string) ?? "0",
      10,
    );
    const mimeType =
      resource.mimeType ?? (fileResponse.headers["content-type"] as string);
    const fileName = resource.fileName ?? "file";

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", mimeType);
    if (fileSize > 0) res.setHeader("Content-Length", fileSize);

    fileResponse.data.on("error", (err: Error) => {
      log.error(
        { err, postId },
        "Error while streaming file from Cloudinary",
      );
      if (!res.headersSent) res.status(500).send("Error streaming file");
      res.destroy(err);
    });

    req.on("close", () => {
      if (!res.writableEnded) {
        log.warn({ postId, userId: req.user.id }, "User aborted download");
        fileResponse.data.destroy();
      }
    });

    fileResponse.data.pipe(res).on("end", () => {
      log.info(
        {
          postId: resource.id,
          userId: req.user.id,
          fileSize,
        },
        "Post resource streamed successfully",
      );
    });
  },
);

export { getAllPosts, getPostById, getPostForEdit, downloadResource };
