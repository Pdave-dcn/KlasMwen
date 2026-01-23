import { create } from "zustand";

import type { User } from "@/types/auth.type";

interface ChatStore {
  // Selection state
  selectedGroupId: string | null;
  selectGroup: (groupId: string | null) => void;

  // Current user
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  // Selection
  selectedGroupId: null,
  selectGroup: (groupId) => set({ selectedGroupId: groupId }),

  // Current user
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
}));
