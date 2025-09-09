import { useQuery } from "@tanstack/react-query";

import { getActiveUserProfile, getUserProfile } from "@/api/user.api";

const useProfileUser = (userId?: string) => {
  return useQuery({
    queryKey: userId ? ["profile", userId] : ["me"],
    queryFn: userId
      ? () => getUserProfile(userId)
      : () => getActiveUserProfile(),
  });
};

export default useProfileUser;
