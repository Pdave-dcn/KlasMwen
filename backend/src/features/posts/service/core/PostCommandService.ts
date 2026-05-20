import {
  PostCreationFailedError,
  PostNotFoundError,
  PostUpdateFailedError,
} from "../../../../core/error/custom/post.error.js";
import {
  permissionService as defaultPermissionService,
  type PermissionService,
} from "../../../../core/security/PermissionService.js";
import {
  postRepository,
  type IPostRepository,
} from "../repositories/postRepository.js";
import {
  postTransformer,
  type IPostTransformer,
} from "../transformers/postTransformers.js";

import {
  cloudinaryCleanupService,
  type ICloudinaryCleanupService,
} from "./CloudinaryCleanupService.js";
import {
  postValidationService,
  type IPostValidationService,
} from "./PostValidationService.js";

import type { ValidatedPostUpdateData } from "../../../../zodSchemas/post.zod.js";
import type {
  BasePost,
  CreatePostInput,
  EditResponse,
  TransformedPost,
  UploadedFileInfo,
} from "../types/postTypes.js";

interface IPostCommandService {
  createPost(
    input: CreatePostInput,
    userId: string,
    uploadedFile: UploadedFileInfo | null,
  ): Promise<TransformedPost>;
  deletePost(postId: string, user: Express.User): Promise<void>;
  updatePost(
    validatedData: ValidatedPostUpdateData,
    postId: string,
    user: Express.User,
  ): Promise<BasePost>;
  getPostForEdit(user: Express.User, postId: string): Promise<EditResponse>;
}

class PostCommandService implements IPostCommandService {
  constructor(
    private repository: IPostRepository,
    private validationService: IPostValidationService,
    private cloudinary: ICloudinaryCleanupService,
    private transformer: IPostTransformer,
    private permission: PermissionService = defaultPermissionService,
  ) {}

  async createPost(
    input: CreatePostInput,
    userId: string,
    uploadedFile: UploadedFileInfo | null,
  ): Promise<TransformedPost> {
    const newPost = await this.repository.command.createPost(input, userId);

    if (!newPost) {
      if (uploadedFile) {
        await this.cloudinary.cleanupFile(
          uploadedFile.publicId,
          "PostCommandService.createPost",
        );
      }
      throw new PostCreationFailedError();
    }

    return this.transformer.transformPost(newPost);
  }

  async deletePost(postId: string, user: Express.User): Promise<void> {
    const post = await this.validationService.verifyPostExists(postId);
    this.permission.assertCanDeletePost(user, post);

    if (post.type === "RESOURCE" && post.fileUrl) {
      await this.cloudinary.handleResourceCleanup(
        post.fileUrl,
        "PostCommandService.deletePost",
      );
    }

    await this.repository.command.delete(postId);
  }

  async updatePost(
    validatedData: ValidatedPostUpdateData,
    postId: string,
    user: Express.User,
  ) {
    const post = await this.validationService.verifyPostExists(postId);
    this.permission.assertCanUpdatePost(user, post);
    this.validationService.validateEditTimeWindow(post.createdAt, postId);

    const updateData =
      validatedData.type === "RESOURCE"
        ? { title: validatedData.title }
        : { title: validatedData.title, content: validatedData.content };

    const updatedPost = await this.repository.command.updatePost(
      postId,
      updateData,
      validatedData.tagIds || [],
    );

    if (!updatedPost) {
      throw new PostUpdateFailedError(postId);
    }

    return updatedPost;
  }

  async getPostForEdit(
    user: Express.User,
    postId: string,
  ): Promise<EditResponse> {
    const post = await this.repository.query.findPostForEdit(postId);

    if (!post) {
      throw new PostNotFoundError(postId);
    }

    this.permission.assertCanUpdatePost(user, post);

    const transformedPost = this.transformer.transformPost(post);
    return this.transformer.toEditResponse(transformedPost);
  }
}

const postCommandService = new PostCommandService(
  postRepository,
  postValidationService,
  cloudinaryCleanupService,
  postTransformer,
  defaultPermissionService,
);

export { PostCommandService, postCommandService, type IPostCommandService };
