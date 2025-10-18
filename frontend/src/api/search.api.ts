import handleZodValidationError from "@/utils/zodErrorHandler.util";
import { SearchServerResponseSchema } from "@/zodSchemas/search.zod";

import api from "./api";

const searchPostsByTerm = async (
  searchTerm: string,
  limit = 10,
  cursor?: string
) => {
  try {
    const res = await api.get("/search", {
      params: { search: searchTerm, limit, cursor },
    });

    const validatedData = SearchServerResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "searchPostsByTerm");
    throw error;
  }
};

export { searchPostsByTerm };
