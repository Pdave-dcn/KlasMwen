import api from "./api";

export const toggleLike = async (postId: string) => {
  await api.post(`/posts/${postId}/like`);
};
