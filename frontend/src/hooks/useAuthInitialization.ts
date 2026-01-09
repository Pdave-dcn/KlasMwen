import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import api from "@/api/api";
import { connectSocket, disconnectSocket } from "@/lib/socket/socket";
import { useAuthStore } from "@/stores/auth.store";
import { AuthVerificationResponseSchema } from "@/zodSchemas/auth.zod";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export const useAuthInitialization = () => {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      // Wait for store hydration
      await new Promise<void>((resolve) => {
        if (useAuthStore.persist.hasHydrated()) {
          resolve();
        } else {
          const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
            unsubscribe();
            resolve();
          });

          // Fallback timeout
          setTimeout(() => {
            unsubscribe();
            resolve();
          }, 2000);
        }
      });

      if (!isMounted) return;

      // Verify authentication
      try {
        const res = await api.get("/auth/me");
        const validatedData = AuthVerificationResponseSchema.parse(res.data);

        if (!isMounted) return;

        login(validatedData.user);
        connectSocket();
        setStatus("authenticated");
      } catch {
        if (!isMounted) return;

        logout();
        disconnectSocket();
        setStatus("unauthenticated");
      }
    };

    void initialize();

    return () => {
      isMounted = false;
      disconnectSocket();
    };
  }, [login, logout, navigate]);

  return status;
};
