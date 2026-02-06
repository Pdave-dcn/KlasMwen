import { create } from "zustand";

type PresenceState = {
  onlineUsers: Set<string>;

  // Group ID -> Count of people currently in that chat room
  groupActivityCounts: Record<string, number>;

  setOnline: (id: string) => void;
  setOffline: (id: string) => void;
  setInitialPresence: (ids: string[]) => void;

  // Action for group discovery/hub
  updateGroupActivityCounts: (counts: Record<string, number>) => void;
};

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUsers: new Set(),
  groupActivityCounts: {},

  setInitialPresence: (ids) => set(() => ({ onlineUsers: new Set(ids) })),

  setOnline: (id) =>
    set((state) => {
      if (state.onlineUsers.has(id)) return state;
      const next = new Set(state.onlineUsers);
      next.add(id);
      return { onlineUsers: next };
    }),

  setOffline: (id) =>
    set((state) => {
      if (!state.onlineUsers.has(id)) return state;
      const next = new Set(state.onlineUsers);
      next.delete(id);
      return { onlineUsers: next };
    }),

  updateGroupActivityCounts(newCounts) {
    set((state) => ({
      groupActivityCounts: {
        ...state.groupActivityCounts,
        ...newCounts,
      },
    }));
  },
}));
