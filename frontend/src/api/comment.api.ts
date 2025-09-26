import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  ParentCommentsResponseSchema,
  ReplyResponseSchema,
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

    const validatedData = ReplyResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getParentCommentReplies");
    throw error;
  }
};

export { getPostParentComments, getParentCommentReplies };
