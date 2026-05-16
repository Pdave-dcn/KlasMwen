import {
  postCommandRepository,
  type IPostCommandRepository,
} from "./core/PostCommandRepository.js";
import {
  postQueryRepository,
  type IPostQueryRepository,
} from "./core/PostQueryRepository.js";
import {
  postValidationRepository,
  type IPostValidationRepository,
} from "./core/PostValidationRepository.js";

interface IPostRepository {
  query: IPostQueryRepository;
  command: IPostCommandRepository;
  validate: IPostValidationRepository;
}

class PostRepository implements IPostRepository {
  constructor(
    readonly query: IPostQueryRepository,
    readonly command: IPostCommandRepository,
    readonly validate: IPostValidationRepository,
  ) {}
}

const postRepository = new PostRepository(
  postQueryRepository,
  postCommandRepository,
  postValidationRepository,
);

export { postRepository, type IPostRepository };
