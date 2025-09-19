import handleZodValidationError from "@/utils/zodErrorHandler.util";
import { AvatarServerResponseSchema } from "@/zodSchemas/avatar.zod";

import api from "./api";

const getAvatars = async (cursor?: string | number, limit = 10) => {
  try {
    const res = await api.get("/avatars/available", {
      params: { cursor, limit },
    });

    const validatedData = AvatarServerResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getAvatars");
    throw error;
  }
};

export { getAvatars };
