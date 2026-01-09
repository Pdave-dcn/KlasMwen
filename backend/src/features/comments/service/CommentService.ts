import { bindMethods } from "../../../utils/bindMethods.util.js";

import CommentCommandService from "./core/CommentCommandService.js";
import CommentQueryService from "./core/CommentQueryService.js";
import CommentValidationService from "./core/CommentValidationService.js";

/**
 * Main facade for comment operations.
 * Delegates to specialized services for different concerns.
 */
class CommentService {
  // Query Operations
  static getUserCommentsWithRelations: typeof CommentQueryService.getUserCommentsWithRelations;
  static getParentComments: typeof CommentQueryService.getParentComments;
  static getReplies: typeof CommentQueryService.getReplies;

  // Command Operations
  static createComment: typeof CommentCommandService.createComment;
  static deleteComment: typeof CommentCommandService.deleteComment;

  // Validation Operations
  static commentExists: typeof CommentValidationService.commentExists;

  static {
    Object.assign(
      this,
      bindMethods(CommentQueryService, [
        "getUserCommentsWithRelations",
        "getParentComments",
        "getReplies",
      ]),
      bindMethods(CommentCommandService, ["createComment", "deleteComment"]),
      bindMethods(CommentValidationService, ["commentExists"])
    );
  }
}

export default CommentService;
