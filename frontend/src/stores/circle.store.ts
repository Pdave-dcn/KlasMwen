import { create } from "zustand";

import type { User } from "@/types/auth.type";

interface CircleStoreState {
  // Selection state
  selectedCircleId: string | null;
  selectCircle: (circleId: string | null) => void;

  // Current user context
  currentUser: User | null;
  setCurrentUser: (user: User) => void;

  onlineMemberIds: Set<string>;
  setOnlineMembers: (userIds: string[]) => void;
  clearOnlineMembers: () => void;

  // Room Presence (Who is currently looking at the chat room)
  presentMemberIds: Set<string>;
  setMemberJoined: (userId: string) => void;
  setMemberLeft: (userId: string) => void;
  setPresentMembers: (userIds: string[]) => void;
  clearPresence: () => void;
}

export const useCircleStore = create<CircleStoreState>((set) => ({
  // Selection
  selectedCircleId: null,
  selectCircle: (circleId) => {
    set({ selectedCircleId: circleId, presentMemberIds: new Set() });
  },

  // Current user
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // Room online state
  onlineMemberIds: new Set(),
  setOnlineMembers(userIds) {
    set({ onlineMemberIds: new Set(userIds) });
  },
  clearOnlineMembers: () => set({ onlineMemberIds: new Set() }),

  // Room Presence
  presentMemberIds: new Set(),
  setPresentMembers: (userIds) => set({ presentMemberIds: new Set(userIds) }),

  setMemberJoined: (id) =>
    set((state) => ({
      presentMemberIds: new Set(state.presentMemberIds).add(id),
    })),

  setMemberLeft: (id) =>
    set((state) => {
      const next = new Set(state.presentMemberIds);
      next.delete(id);
      return { presentMemberIds: next };
    }),

  clearPresence: () => set({ presentMemberIds: new Set() }),
}));
