import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  GetActiveUserResponseSchema,
  GetUserProfileResponseSchema,
} from "@/zodSchemas/user.zod";

import api from "./api";

const getUserProfile = async (userId: string) => {
  try {
    const res = await api.get(`/users/${userId}`);
    const validatedData = GetUserProfileResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error);
    throw error;
  }
};

const getActiveUserProfile = async () => {
  try {
    const res = await api.get("/users/me");
    const validatedData = GetActiveUserResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error);
    throw error;
  }
};

export { getUserProfile, getActiveUserProfile };
