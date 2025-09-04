import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AuthenticatedUser } from "@/types/auth.type";

interface AuthState {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;

  login: (user: AuthenticatedUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
