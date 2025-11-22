import { useNavigate } from "react-router-dom";

import { useMutation } from "@tanstack/react-query";

import signInGuest from "@/api/guest.api";
import { useAuthStore } from "@/stores/auth.store";

export const useGuestAuthMutation = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: signInGuest,
    onSuccess: (data) => {
      useAuthStore.getState().login(data.user);

      void navigate("/home");
    },
  });
};
