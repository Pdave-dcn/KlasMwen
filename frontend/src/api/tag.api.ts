import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  PopularTagsResponseSchema,
  TagsResponseSchema,
} from "@/zodSchemas/tag.zod";

import api from "./api";

const getTags = async () => {
  try {
    const res = await api.get("/tags");
    const validatedData = TagsResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getTags");
    throw error;
  }
};

const getPopularTags = async () => {
  try {
    const res = await api.get("/tags/popular");
    const validatedData = PopularTagsResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getPopularTags");
    throw error;
  }
};

export { getTags, getPopularTags };
