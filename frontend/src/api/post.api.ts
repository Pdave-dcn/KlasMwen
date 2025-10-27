import type { UpdatePostData } from "@/queries/usePosts";
import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  CreatedPostResponseSchema,
  DeletePostResponseSchema,
  PostEditResponseSchema,
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

const getPostForEdit = async (postId: string) => {
  try {
    const res = await api.get(`/posts/${postId}/edit`);

    const validatedData = PostEditResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getPostForEdit");
    throw error;
  }
};

const updatePost = async (postId: string, data: UpdatePostData) => {
  try {
    const res = await api.put(`/posts/${postId}`, data);

    const validatedData = res.data;

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "updatePost");
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

const downloadPostResourceWithProgress = async (
  postId: string,
  fileName: string,
  onProgress?: (percent: number) => void
) => {
  try {
    const res = await api.get(`/posts/${postId}/download`, {
      responseType: "blob",
      timeout: 0,
      onDownloadProgress: (progressEvent) => {
        const total = progressEvent.total ?? 0;
        if (total > 0) {
          const current = progressEvent.loaded ?? 0;
          const percent = Math.round((current / total) * 100);
          onProgress?.(percent);
        } else {
          onProgress?.(50);
        }
      },
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);

    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    handleZodValidationError(error, "downloadPostResourceWithProgress");
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
  getPostForEdit,
  createNewPost,
  deletePost,
  updatePost,
  downloadPostResourceWithProgress,
};
