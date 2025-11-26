import { create } from "zustand";

import type { User } from "@/types/auth.type";

interface CommentState {
  postId: string;
  user: User | null;
  navigate?: (url: string) => void;

  openReplies: Set<number>;
  openCommentForm: Set<number>;

  setUser: (user: User | null) => void;
  setPostId: (postId: string) => void;
  setNavigate: (fn: (url: string) => void) => void;

  handleUserClick: (userId: string) => void;
  toggleCommentForm: (commentId: number) => void;
  toggleReplies: (commentId: number) => void;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  postId: "",
  user: null,
  navigate: undefined,

  openReplies: new Set(),
  openCommentForm: new Set(),

  setUser: (user: User | null) => set({ user }),
  setPostId: (postId: string) => set({ postId }),
  setNavigate: (fn: (url: string) => void) => set({ navigate: fn }),

  toggleReplies: (commentId) =>
    set((state) => {
      const next = new Set(state.openReplies);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return { openReplies: next };
    }),

  toggleCommentForm: (commentId) =>
    set((state) => {
      const next = new Set(state.openCommentForm);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }

      return { openCommentForm: next };
    }),

  handleUserClick: (userId) => {
    const { navigate } = get();
    if (navigate) navigate(`/profile/${userId}`);
  },
}));
