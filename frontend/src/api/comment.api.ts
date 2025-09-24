import handleZodValidationError from "@/utils/zodErrorHandler.util";
import { ParentCommentsResponseSchema } from "@/zodSchemas/comment.zod";

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
  }
};

export { getPostParentComments };
