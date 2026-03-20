import { create } from "zustand";

import type { User } from "@/types/auth.type";
import type { StudyCircleRole as MemberRole } from "@/zodSchemas/circle.zod";

interface CircleStoreState {
  // Selection state
  selectedCircleId: string | null;
  selectCircle: (circleId: string | null) => void;

  // Resets the selected circle (used after leaving, deleting or unmounting a circle to clear stale data)
  resetSelectedCircle: () => void;

  // Current user context
  currentUser: User | null;
  setCurrentUser: (user: User) => void;

  // Current user's role in the selected circle (OWNER, MODERATOR, MEMBER, or null if not a member)
  currentUserMemberRole: MemberRole | null;
  setCurrentUserMemberRole: (role: MemberRole | null) => void;

  // Room online state
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
  resetSelectedCircle: () =>
    set({ selectedCircleId: null, presentMemberIds: new Set() }),

  // Current user
  currentUser: null,
  currentUserMemberRole: null,
  setCurrentUserMemberRole: (role) => set({ currentUserMemberRole: role }),
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
