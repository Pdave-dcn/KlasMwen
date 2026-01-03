import { bindMethods } from "../../../../utils/bindMethods.util.js";

import PostCommandRepository from "./core/PostCommandRepository.js";
import PostQueryRepository from "./core/PostQueryRepository.js";
import PostValidationRepository from "./core/PostValidationRepository.js";

/**
 * PostRepository - Main facade for post data access
 * Delegates to specialized repositories for different concerns
 */
class PostRepository {
  // Query Operations
  static findManyPosts: typeof PostQueryRepository.findManyPosts;
  static countPosts: typeof PostQueryRepository.countPosts;
  static findPostById: typeof PostQueryRepository.findPostById;
  static findExtendedPostById: typeof PostQueryRepository.findExtendedPostById;
  static findPostMetadata: typeof PostQueryRepository.findPostMetadata;
  static findUserLikes: typeof PostQueryRepository.findUserLikes;
  static findUserBookmarks: typeof PostQueryRepository.findUserBookmarks;
  static findBookmarksForPosts: typeof PostQueryRepository.findBookmarksForPosts;
  static findLikesForPosts: typeof PostQueryRepository.findLikesForPosts;
  static findBookmark: typeof PostQueryRepository.findBookmark;
  static findLike: typeof PostQueryRepository.findLike;
  static findPostForEdit: typeof PostQueryRepository.findPostForEdit;

  // Command Operations
  static createPost: typeof PostCommandRepository.createPost;
  static updatePost: typeof PostCommandRepository.updatePost;
  static delete: typeof PostCommandRepository.delete;

  // Validation Operations
  static exists: typeof PostValidationRepository.exists;

  static {
    Object.assign(
      this,
      bindMethods(PostQueryRepository, [
        "findManyPosts",
        "countPosts",
        "findPostById",
        "findExtendedPostById",
        "findPostMetadata",
        "findUserLikes",
        "findUserBookmarks",
        "findBookmarksForPosts",
        "findLikesForPosts",
        "findBookmark",
        "findLike",
        "findPostForEdit",
      ]),
      bindMethods(PostCommandRepository, [
        "createPost",
        "updatePost",
        "delete",
      ]),
      bindMethods(PostValidationRepository, ["exists"])
    );
  }
}

export default PostRepository;
