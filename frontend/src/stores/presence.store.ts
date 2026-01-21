import { create } from "zustand";

type PresenceState = {
  onlineUsers: Set<string>;
  setOnline: (id: string) => void;
  setOffline: (id: string) => void;
};

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUsers: new Set(),

  setOnline: (id) =>
    set((state) => ({
      onlineUsers: new Set(state.onlineUsers).add(id),
    })),

  setOffline: (id) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(id);
      return { onlineUsers: next };
    }),
}));
