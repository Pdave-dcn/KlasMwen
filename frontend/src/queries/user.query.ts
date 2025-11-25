import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateUserInfo } from "@/api/user.api";
import { useAuthStore } from "@/stores/auth.store";

/**
 * A custom React Hook for updating the authenticated user's profile.
 *
 * This hook uses `useMutation` to update the user's information and handles state synchronization
 * with the Zustand store upon success. It also manages error handling by displaying toast notifications.
 *
 * @returns {object} The mutation state and functions.
 */
const useUpdateUserInfo = () => {
  const queryClient = useQueryClient();
  const login = useAuthStore((state) => state.login);
  return useMutation({
    mutationFn: updateUserInfo,
    onSuccess: async (data) => {
      const updatedUser = { ...data.user };
      login(updatedUser);

      await queryClient.invalidateQueries({
        queryKey: ["profile"],
      });
    },
  });
};

export { useUpdateUserInfo };
