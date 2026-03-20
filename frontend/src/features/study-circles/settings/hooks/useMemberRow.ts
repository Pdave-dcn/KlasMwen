import { toast } from "sonner";

import {
  useRemoveCircleMemberMutation,
  useUpdateCircleMemberRoleMutation,
} from "@/queries/circle";
import { useCircleStore } from "@/stores/circle.store";
import {
  type CircleMember,
  type StudyCircleRole as MemberRole,
} from "@/zodSchemas/circle.zod";

const roleLabels: Record<MemberRole, string> = {
  OWNER: "Owner",
  MODERATOR: "Mod",
  MEMBER: "Member",
};

export function useMemberRow(member: CircleMember) {
  const currentCircleId = useCircleStore((state) => state.selectedCircleId);

  const roleUpdateMutation = useUpdateCircleMemberRoleMutation(currentCircleId);
  const kickMemberMutation = useRemoveCircleMemberMutation(currentCircleId);

  const handleKick = () => {
    kickMemberMutation.mutate(member.user.id, {
      onSuccess: () => {
        toast.success(
          `${member.user.username} has been removed from the circle.`,
        );
      },
    });
  };

  const handleRoleChange = (newRole: MemberRole) => {
    roleUpdateMutation.mutate(
      { userId: member.user.id, data: { role: newRole } },
      {
        onSuccess: () => {
          toast.success(
            `${member.user.username} is now a ${roleLabels[newRole]}.`,
          );
        },
      },
    );
  };

  return {
    handlers: {
      handleKick,
      handleRoleChange,
    },
    pending: {
      kicking: kickMemberMutation.isPending,
      updatingRole: roleUpdateMutation.isPending,
    },
  };
}
