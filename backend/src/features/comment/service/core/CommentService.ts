import type { CommentCommandService } from "./CommentCommandService.js";
import type { CommentQueryService } from "./CommentQueryService.js";
import type { CommentValidationService } from "./CommentValidationService.js";

class CommentService {
  constructor(
    readonly query: CommentQueryService,
    readonly command: CommentCommandService,
    readonly validate: CommentValidationService,
  ) {}
}

export { CommentService };
