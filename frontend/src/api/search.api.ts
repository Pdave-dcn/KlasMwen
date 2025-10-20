import handleZodValidationError from "@/utils/zodErrorHandler.util";
import { SearchServerResponseSchema } from "@/zodSchemas/search.zod";

import api from "./api";

const searchPosts = async (
  searchTerm: string,
  tagIds: string[],
  limit = 10,
  cursor?: string
) => {
  try {
    const res = await api.get("/search", {
      params: { search: searchTerm, limit, cursor, tagIds: tagIds.join(",") },
    });

    const validatedData = SearchServerResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "searchPosts");
    throw error;
  }
};

export { searchPosts };
