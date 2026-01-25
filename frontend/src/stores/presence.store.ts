import { create } from "zustand";

type PresenceState = {
  onlineUsers: Set<string>;
  setOnline: (id: string) => void;
  setOffline: (id: string) => void;
  setInitialPresence: (ids: string[]) => void;
};

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUsers: new Set(),

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
}));
