import handleZodValidationError from "@/utils/zodErrorHandler.util";
import { PostResponseSchema } from "@/zodSchemas/post.zod";

import api from "./api";

const getUserPosts = async (
  userId: string,
  cursor?: string | number,
  limit = 10
) => {
  try {
    const res = await api.get(`/users/${userId}/posts`, {
      params: { cursor, limit },
    });
    const validated = PostResponseSchema.parse(res.data);

    return validated;
  } catch (error) {
    handleZodValidationError(error, "getUserProfile");
    throw error;
  }
};

const getActiveUserPosts = async (cursor?: string | number, limit = 10) => {
  try {
    const res = await api.get("/users/me/posts", {
      params: { cursor, limit },
    });
    const validatedData = PostResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getActiveUserPosts");
    throw error;
  }
};

const getHomePagePosts = async (cursor?: string | number, limit = 10) => {
  try {
    const res = await api.get("/posts", {
      params: { cursor, limit },
    });

    const validatedData = PostResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getHomePagePosts");
    throw error;
  }
};

const getActiveUserLikedPosts = async (
  cursor?: string | number,
  limit = 10
) => {
  try {
    const res = await api.get("/users/me/posts/like", {
      params: { cursor, limit },
    });

    const validatedData = PostResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getActiveUserLikedPosts");
    throw error;
  }
};

const getActiveUserBookmarks = async (cursor?: string | number, limit = 10) => {
  try {
    const res = await api.get("/users/bookmarks", {
      params: { cursor, limit },
    });

    const validatedData = PostResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getActiveUserBookmarks");
    throw error;
  }
};

export {
  getUserPosts,
  getActiveUserPosts,
  getHomePagePosts,
  getActiveUserLikedPosts,
  getActiveUserBookmarks,
};
