import handleZodValidationError from "@/utils/zodErrorHandler.util";
import { TagResponseSchema } from "@/zodSchemas/tag.zod";

import api from "./api";

const getTags = async () => {
  try {
    const res = await api.get("/tags");
    const validatedData = TagResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getTags");
    throw error;
  }
};

export { getTags };
