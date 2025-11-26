import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { zodResolver } from "@hookform/resolvers/zod";

import { useProfileUser as useGetActiveUserInfo } from "@/queries/profile.query";
import { useUpdateUserInfo } from "@/queries/user.query";
import { UpdateProfileSchema } from "@/zodSchemas/user.zod";

type FormData = {
  bio: string;
  avatarId: number;
  twitter: string;
  instagram: string;
};

export const useProfileEdit = () => {
  const navigate = useNavigate();

  const { register, handleSubmit, formState, setValue, reset } =
    useForm<FormData>({
      resolver: zodResolver(UpdateProfileSchema),
    });

  const { errors } = formState;

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState("");

  const { data: user, isLoading, error } = useGetActiveUserInfo(undefined);
  const mutation = useUpdateUserInfo();

  useEffect(() => {
    if (user) {
      reset({
        bio: user.bio ?? "",
        avatarId: user.avatar?.id,
      });

      if (user.avatar) {
        setCurrentAvatarUrl(user.avatar.url);
      }
    }
  }, [user, reset]);

  const handleSelectAvatar = (avatarId: number, avatarUrl: string) => {
    setCurrentAvatarUrl(avatarUrl);
    setValue("avatarId", avatarId, { shouldValidate: true });
  };

  const handleCloseAvatarModal = () => {
    setIsAvatarModalOpen(false);
  };

  const handleOpenAvatarModal = () => {
    setIsAvatarModalOpen(true);
  };

  const handleCancel = async () => {
    await navigate("/profile/me", { replace: true });
  };

  const onSubmit = async (data: FormData) => {
    mutation.mutate(data);
    await navigate("/profile/me");
  };

  return {
    user,
    isLoading,
    error,
    currentAvatarUrl,
    isAvatarModalOpen,
    register,
    errors,
    handlers: {
      handleSubmit: handleSubmit(onSubmit),
      handleSelectAvatar,
      handleCloseAvatarModal,
      handleOpenAvatarModal,
      handleCancel,
    },
  };
};
