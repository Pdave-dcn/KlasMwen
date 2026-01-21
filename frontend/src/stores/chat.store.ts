import { create } from "zustand";

import type { User } from "@/types/auth.type";
import type { ChatMessage } from "@/zodSchemas/chat.zod";

interface ChatStore {
  // Selection state
  selectedGroupId: string | null;
  selectGroup: (groupId: string | null) => void;

  // Current user
  currentUser: User | null;
  setCurrentUser: (user: User) => void;

  // Real-time message updates (socket messages)
  realtimeMessages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;

  // UI state
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;

  // Group read status (local client state)
  markGroupAsRead: (groupId: string) => void;
  unreadGroups: Set<string>;
}

export const useChatStore = create<ChatStore>((set) => ({
  // Selection
  selectedGroupId: null,
  selectGroup: (groupId) => set({ selectedGroupId: groupId }),

  // Current user
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // Real-time messages (from socket, before React Query refetches)
  realtimeMessages: [],
  addMessage: (message) =>
    set((state) => ({
      realtimeMessages: [...state.realtimeMessages, message],
    })),
  clearMessages: () => set({ realtimeMessages: [] }),

  // UI state
  isMuted: false,
  setIsMuted: (muted) => set({ isMuted: muted }),

  // Unread tracking
  unreadGroups: new Set<string>(),
  markGroupAsRead: (groupId) =>
    set((state) => {
      const newUnreadGroups = new Set(state.unreadGroups);
      newUnreadGroups.delete(groupId);
      return { unreadGroups: newUnreadGroups };
    }),
}));
