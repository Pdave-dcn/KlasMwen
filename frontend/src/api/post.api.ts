import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  CreatedPostResponseSchema,
  DeletePostResponseSchema,
  PostResponseSchema,
  SinglePostResponseSchema,
  type PostFormValues,
} from "@/zodSchemas/post.zod";

import api from "./api";

const createNewPost = async (data: PostFormValues | FormData) => {
  try {
    let res;

    if (data instanceof FormData) {
      res = await api.post("/posts", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      res = await api.post("/posts", data);
    }

    const validatedData = CreatedPostResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "createNewPost");
    throw error;
  }
};

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

const getPostById = async (postId: string) => {
  try {
    const res = await api.get(`/posts/${postId}`);

    const validatedData = SinglePostResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getPostById");
    throw error;
  }
};

const deletePost = async (postId: string) => {
  try {
    const res = await api.delete(`/posts/${postId}`);

    const validatedData = DeletePostResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "deletePost");
    throw error;
  }
};

export {
  getUserPosts,
  getActiveUserPosts,
  getHomePagePosts,
  getActiveUserLikedPosts,
  getActiveUserBookmarks,
  getPostById,
  createNewPost,
  deletePost,
};
