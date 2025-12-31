import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { User } from "@/types/auth.type";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;

  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isGuest: false,

      login: (user) =>
        set({ user, isAuthenticated: true, isGuest: user.role === "GUEST" }),
      logout: () => {
        set({ user: null, isAuthenticated: false, isGuest: false });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
