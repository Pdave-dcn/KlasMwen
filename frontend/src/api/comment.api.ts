import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  CommentCreationServerResponseSchema,
  ParentCommentsResponseSchema,
  RepliesResponseSchema,
  type CommentCreationData,
} from "@/zodSchemas/comment.zod";

import api from "./api";

const getPostParentComments = async (
  postId: string,
  cursor?: string | number,
  limit = 10
) => {
  try {
    const res = await api.get(`/posts/${postId}/comments`, {
      params: { cursor, limit },
    });

    const validatedData = ParentCommentsResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getPostParentComments");
    throw error;
  }
};

const getParentCommentReplies = async (
  parentId: number,
  cursor?: string | number,
  limit = 10
) => {
  try {
    const res = await api.get(`/comments/${parentId}/replies`, {
      params: { cursor, limit },
    });

    const validatedData = RepliesResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getParentCommentReplies");
    throw error;
  }
};

const createComment = async (postId: string, data: CommentCreationData) => {
  try {
    const res = await api.post(`/posts/${postId}/comments`, data);

    const validatedData = CommentCreationServerResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "createComment");
    throw error;
  }
};

export { getPostParentComments, getParentCommentReplies, createComment };
