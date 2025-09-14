import handleZodValidationError from "@/utils/zodErrorHandler.util";
import { ProfileCommentsResponseSchema } from "@/zodSchemas/comment.zod";
import { MediaPostResponseSchema } from "@/zodSchemas/post.zod";
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
    handleZodValidationError(error, "getUserProfile");
    throw error;
  }
};

const getActiveUserProfile = async () => {
  try {
    const res = await api.get("/users/me");
    const validatedData = GetActiveUserResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getActiveUserProfile");
    throw error;
  }
};

const getUserProfileComments = async (
  userId: string,
  cursor?: string | number,
  limit = 10
) => {
  try {
    const res = await api.get(`/users/${userId}/comments`, {
      params: { cursor, limit },
    });
    const validatedData = ProfileCommentsResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getUserProfileComments");
    throw error;
  }
};

const getUserProfileMediaPosts = async (
  userId: string,
  cursor?: string | number,
  limit = 10
) => {
  try {
    const res = await api.get(`/users/${userId}/posts/media`, {
      params: { cursor, limit },
    });

    const validatedData = MediaPostResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getUserMediaPosts");
    throw error;
  }
};
export {
  getUserProfile,
  getActiveUserProfile,
  getUserProfileComments,
  getUserProfileMediaPosts,
};
