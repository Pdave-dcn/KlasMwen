import {
  postCommandService,
  type IPostCommandService,
} from "./core/PostCommandService.js";
import {
  postQueryService,
  type IPostQueryService,
} from "./core/PostQueryService.js";
import {
  postSearchService,
  type IPostSearchService,
} from "./core/PostSearchService.js";
import {
  postValidationService,
  type IPostValidationService,
} from "./core/PostValidationService.js";
import {
  postRepository,
  type IPostRepository,
} from "./repositories/postRepository.js";

class PostService {
  constructor(
    readonly query: IPostQueryService,
    readonly command: IPostCommandService,
    readonly validate: IPostValidationService,
    readonly search: IPostSearchService,
    readonly repository: IPostRepository,
  ) {}
}

const postService = new PostService(
  postQueryService,
  postCommandService,
  postValidationService,
  postSearchService,
  postRepository,
);

export { postService, type PostService };
