import { CommentTransformer } from "./commentTransformer.js";
import { CommentCommandService } from "./core/CommentCommandService.js";
import { CommentQueryService } from "./core/CommentQueryService.js";
import { CommentService } from "./core/CommentService.js";
import { CommentValidationService } from "./core/CommentValidationService.js";
import { CommentRepository } from "./repositories/commentRepository.js";

const commentValidationService = new CommentValidationService(CommentRepository);
const commentQueryService = new CommentQueryService(
  CommentRepository,
  CommentTransformer,
);
const commentCommandService = new CommentCommandService(
  commentValidationService,
  CommentRepository,
);
const commentService = new CommentService(
  commentQueryService,
  commentCommandService,
  commentValidationService,
);

export { commentService, commentQueryService, type CommentService };
