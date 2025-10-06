import api from "./api";

const createBookmark = async (postId: string) => {
  await api.post(`/bookmarks/${postId}`);
};

const deleteBookmark = async (postId: string) => {
  await api.delete(`/bookmarks/${postId}`);
};

export { createBookmark, deleteBookmark };
