import { PostCommandService } from "./core/PostCommandService.js";
import { PostQueryService } from "./core/PostQueryService.js";
import { PostSearchService } from "./core/PostSearchService.js";
import { PostValidationService } from "./core/PostValidationService.js";

/**
 * Main facade for post operations.
 * Delegates to specialized services for different concerns.
 */
export class PostService {
  // Query Operations
  static getAllPosts = PostQueryService.getAllPosts.bind(PostQueryService);
  static getUserPosts = PostQueryService.getUserPosts.bind(PostQueryService);
  static getUserMediaPosts =
    PostQueryService.getUserMediaPosts.bind(PostQueryService);
  static getUserLikedPosts =
    PostQueryService.getUserLikedPosts.bind(PostQueryService);
  static getUserBookmarkedPosts =
    PostQueryService.getUserBookmarkedPosts.bind(PostQueryService);
  static getPostById = PostQueryService.getPostById.bind(PostQueryService);
  static getResourcePostById =
    PostQueryService.getResourcePostById.bind(PostQueryService);

  // Search Operations
  static searchPosts = PostSearchService.searchPosts.bind(PostSearchService);

  // Command Operations
  static createPost = PostCommandService.createPost.bind(PostCommandService);
  static updatePost = PostCommandService.updatePost.bind(PostCommandService);
  static deletePost = PostCommandService.deletePost.bind(PostCommandService);
  static getPostForEdit =
    PostCommandService.getPostForEdit.bind(PostCommandService);

  // Validation Operations
  static verifyPostExists = PostValidationService.verifyPostExists.bind(
    PostValidationService
  );
}

export default PostService;
