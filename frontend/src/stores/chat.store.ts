import { create } from "zustand";

import type { User } from "@/types/auth.type";

interface ChatStore {
  // Selection state
  selectedGroupId: string | null;
  selectGroup: (groupId: string | null) => void;

  // Current user context
  currentUser: User | null;
  setCurrentUser: (user: User) => void;

  // Room Presence (Who is currently looking at the chat room)
  presentUserIds: Set<string>;
  setMemberJoined: (userId: string) => void;
  setMemberLeft: (userId: string) => void;
  setPresentUsers: (userIds: string[]) => void;
  clearPresence: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  // Selection
  selectedGroupId: null,
  selectGroup: (groupId) => {
    set({ selectedGroupId: groupId, presentUserIds: new Set() });
  },

  // Current user
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // Room Presence
  presentUserIds: new Set(),

  setPresentUsers: (userIds) => set({ presentUserIds: new Set(userIds) }),

  setMemberJoined: (id) =>
    set((state) => ({
      presentUserIds: new Set(state.presentUserIds).add(id),
    })),

  setMemberLeft: (id) =>
    set((state) => {
      const next = new Set(state.presentUserIds);
      next.delete(id);
      return { presentUserIds: next };
    }),

  clearPresence: () => set({ presentUserIds: new Set() }),
}));
