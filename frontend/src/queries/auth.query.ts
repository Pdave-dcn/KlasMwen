import type { UseFormSetError } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useMutation } from "@tanstack/react-query";

import { loginAsGuest, signIn, signUp } from "@/api/auth.api";
import {
  handleAuthError,
  type AuthError,
} from "@/features/auth/error/authErrorHandler";
import { useAuthStore } from "@/stores/auth.store";
import type { FormData } from "@/types/form.type";

import type { AxiosError } from "axios";

export const useAuthMutation = (
  currentForm: "signin" | "signup",
  setError: UseFormSetError<FormData>
) => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: currentForm === "signin" ? signIn : signUp,
    onSuccess: (data) => {
      useAuthStore.getState().login(data.user);

      void navigate("/home");
    },
    onError: (error: AxiosError<AuthError>) => {
      handleAuthError(error, setError);
    },
  });
};

export const useGuestAuthMutation = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginAsGuest,
    onSuccess: (data) => {
      useAuthStore.getState().login(data.user);

      void navigate("/home");
    },
  });
};
