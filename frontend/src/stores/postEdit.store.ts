import { create } from "zustand";

import type { Post } from "@/zodSchemas/post.zod";

interface PostEditState {
  isOpen: boolean;
  postToEdit: Post | null;
  openEditForm: (post: Post) => void;
  closeEditForm: () => void;
}

export const usePostEditStore = create<PostEditState>((set) => ({
  isOpen: false,
  postToEdit: null,

  openEditForm: (post) =>
    set({
      isOpen: true,
      postToEdit: post,
    }),

  closeEditForm: () =>
    set({
      isOpen: false,
      postToEdit: null,
    }),
}));
