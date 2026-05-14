import { useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  useUpdateCircleMutation,
  useCircleAvatarsQuery,
} from "@/queries/circle";
import { useCircleStore } from "@/stores/circle.store";
import {
  EditCircleInfoSchema,
  type EditCircleInfoValues,
  type StudyCircle,
} from "@/zodSchemas/circle.zod";

interface UseEditCircleInfoProps {
  circle: StudyCircle;
  onSuccess: () => void;
}

export function useEditCircleInfo({
  circle,
  onSuccess,
}: UseEditCircleInfoProps) {
  const currentCircleId =
    useCircleStore((state) => state.selectedCircleId) ?? "";

  const updateCircleMutation = useUpdateCircleMutation(currentCircleId);

  // Circle-specific avatar query
  const {
    data: avatarData,
    isLoading: isLoadingAvatars,
    isError: isAvatarError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useCircleAvatarsQuery(24);

  const avatars = avatarData?.pages.flatMap((page) => page.data) ?? [];

  const handleLoadMoreAvatars = () => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  };

  // Avatar selection state
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | undefined>(
    circle.avatar?.url,
  );

  const form = useForm<EditCircleInfoValues>({
    resolver: zodResolver(EditCircleInfoSchema),
    defaultValues: {
      name: circle.name,
      description: circle.description ?? "",
      isPrivate: circle.isPrivate,
      avatarId: undefined,
      tagIds: circle.tags.map((t) => t.id),
    },
  });

  const handleSelectAvatar = (avatarId: number, avatarUrl: string) => {
    form.setValue("avatarId", avatarId);
    setCurrentAvatarUrl(avatarUrl);
    setIsAvatarModalOpen(false);
  };

  const onSubmit = form.handleSubmit((values) => {
    updateCircleMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Circle updated successfully.");
        onSuccess();
      },
      onError: () => {
        toast.error("Failed to update circle. Please try again.");
      },
    });
  });

  return {
    form,
    onSubmit,
    isPending: updateCircleMutation.isPending,
    // Avatar modal
    currentAvatarUrl,
    isAvatarModalOpen,
    avatars,
    isLoadingAvatars,
    isAvatarError,
    pagination: {
      hasNextPage: !!hasNextPage,
      isFetchingNextPage,
      handleLoadMore: handleLoadMoreAvatars,
    },
    isFetchingNextPage,
    handlers: {
      handleSelectAvatar,
      handleOpenAvatarModal: () => setIsAvatarModalOpen(true),
      handleCloseAvatarModal: () => setIsAvatarModalOpen(false),
    },
  };
}
