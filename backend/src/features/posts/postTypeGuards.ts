import type {
  ResourcePost,
  TextPost,
  TransformedPost,
} from "../../types/postTypes.js";

const isResourcePost = (post: TransformedPost): post is ResourcePost => {
  return post.type === "RESOURCE" && post.fileUrl !== null;
};

const isTextPost = (post: TransformedPost): post is TextPost => {
  return (
    (post.type === "QUESTION" || post.type === "NOTE") && post.content !== null
  );
};

export { isResourcePost, isTextPost };
