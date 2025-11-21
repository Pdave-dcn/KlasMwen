import {
  PostCreationFailedError,
  PostNotFoundError,
  PostUpdateFailedError,
} from "../../../../core/error/custom/post.error";
import { assertPermission } from "../../../../core/security/rbac";
import createEditResponse from "../../createEditResponse";
import transformPostTagsToFlat from "../../postTagFlattener";
import PostRepository from "../repositories/postRepository";

import { CloudinaryCleanupService } from "./CloudinaryCleanupService";
import { PostValidationService } from "./PostValidationService";

import type { ValidatedPostUpdateData } from "../../../../zodSchemas/post.zod";
import type {
  CreatePostInput,
  RawPost,
  UploadedFileInfo,
} from "../types/postTypes";

/**
 * Handles all write operations (create, update, delete) for posts.
 * Ensures consistency and business rules for post mutations.
 */
export class PostCommandService {
  /**
   * Create a new post.
   * Handles file cleanup on failure.
   */
  static async createPost(
    input: CreatePostInput,
    userId: string,
    uploadedFile: UploadedFileInfo | null
  ): Promise<Partial<RawPost>> {
    const newPost = await PostRepository.createPost(input, userId);

    if (!newPost) {
      if (uploadedFile) {
        await CloudinaryCleanupService.cleanupFile(
          uploadedFile.publicId,
          "PostCommandService.createPost"
        );
      }
      throw new PostCreationFailedError();
    }

    return transformPostTagsToFlat(newPost as RawPost);
  }

  /**
   * Delete a post and associated resources.
   */
  static async deletePost(postId: string, user: Express.User): Promise<void> {
    const post = await PostValidationService.verifyPostExists(postId);
    assertPermission(user, "posts", "delete", post);

    if (post.type === "RESOURCE" && post.fileUrl) {
      await CloudinaryCleanupService.handleResourceCleanup(
        post.fileUrl,
        "PostCommandService.deletePost"
      );
    }

    await PostRepository.delete(postId);
  }

  /**
   * Update post with validation and permission checks.
   * @throws {PostUpdateFailedError} if update fails or time window expired
   */
  static async updatePost(
    validatedData: ValidatedPostUpdateData,
    postId: string,
    user: Express.User
  ) {
    const post = await PostValidationService.verifyPostExists(postId);
    assertPermission(user, "posts", "update", post);
    PostValidationService.validateEditTimeWindow(post.createdAt, postId);

    const updateData =
      validatedData.type === "RESOURCE"
        ? { title: validatedData.title }
        : { title: validatedData.title, content: validatedData.content };

    const updatedPost = await PostRepository.updatePost(
      postId,
      updateData,
      validatedData.tagIds || []
    );

    if (!updatedPost) {
      throw new PostUpdateFailedError(postId);
    }

    return updatedPost;
  }

  /**
   * Get post for editing with permission check.
   * @throws {PostNotFoundError} if not found
   */
  static async getPostForEdit(user: Express.User, postId: string) {
    const post = await PostRepository.findPostForEdit(postId);

    if (!post) {
      throw new PostNotFoundError(postId);
    }

    assertPermission(user, "posts", "update", post);

    const transformedPost = transformPostTagsToFlat(post);
    return createEditResponse(transformedPost);
  }
}
