export type CircleRole = "OWNER" | "MODERATOR" | "MEMBER";

export type WithCreatorId = {
  id: string;
  creatorId?: string;
  creator?: { id: string };
};

export type WithSenderId = {
  id: number;
  senderId?: string;
  sender?: { id: string };
};

export type WithMembershipRole = {
  role: CircleRole;
  userId?: string;
  user?: { id: string };
};

export type CircleForPolicy = WithCreatorId;
export type CircleMemberForPolicy = WithMembershipRole;
export type CircleMessageForPolicy = WithSenderId & {
  circleId: string;
};

export const circleRegistry = {
  circles: {
    datatype: {} as CircleForPolicy,
    action: ["create", "read", "update", "delete", "join", "invite", "leave"],
  },
  circleMembers: {
    datatype: {} as CircleMemberForPolicy,
    action: ["add", "remove", "updateRole", "view", "mute"],
  },
  circleMessages: {
    datatype: {} as CircleMessageForPolicy,
    action: ["send", "read", "delete"],
  },
} as const;

export type CircleRegistry = typeof circleRegistry;
