import { bindMethods } from "../../../utils/bindMethods.util.js";

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
  static getAllPosts: typeof PostQueryService.getAllPosts;
  static getUserPosts: typeof PostQueryService.getUserPosts;
  static getUserMediaPosts: typeof PostQueryService.getUserMediaPosts;
  static getUserLikedPosts: typeof PostQueryService.getUserLikedPosts;
  static getUserBookmarkedPosts: typeof PostQueryService.getUserBookmarkedPosts;
  static getPostById: typeof PostQueryService.getPostById;
  static getResourcePostById: typeof PostQueryService.getResourcePostById;

  // Search Operations
  static searchPosts: typeof PostSearchService.searchPosts;

  // Command Operations
  static createPost: typeof PostCommandService.createPost;
  static updatePost: typeof PostCommandService.updatePost;
  static deletePost: typeof PostCommandService.deletePost;
  static getPostForEdit: typeof PostCommandService.getPostForEdit;

  // Validation Operations
  static verifyPostExists: typeof PostValidationService.verifyPostExists;

  static {
    Object.assign(
      this,
      bindMethods(PostQueryService, [
        "getAllPosts",
        "getUserPosts",
        "getUserMediaPosts",
        "getUserLikedPosts",
        "getUserBookmarkedPosts",
        "getPostById",
        "getResourcePostById",
      ]),
      bindMethods(PostSearchService, ["searchPosts"]),
      bindMethods(PostCommandService, [
        "createPost",
        "updatePost",
        "deletePost",
        "getPostForEdit",
      ]),
      bindMethods(PostValidationService, ["verifyPostExists"])
    );
  }
}

export default PostService;
