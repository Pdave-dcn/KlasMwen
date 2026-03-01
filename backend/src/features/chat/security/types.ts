import type { Circle, CircleMessage, CircleRole } from "@prisma/client";

type WithCreatorId<T extends { id: string; creatorId: string }> = Pick<
  T,
  "id"
> & {
  creatorId?: string;
  creator?: { id: string };
};

type WithSenderId<T extends { id: number; senderId: string }> = Pick<
  T,
  "id"
> & {
  senderId?: string;
  sender?: { id: string };
};

type WithMembershipRole = {
  role: CircleRole;
  userId?: string;
  user?: { id: string };
};

type CircleForPolicy = WithCreatorId<Circle>;
type CircleMemberForPolicy = WithMembershipRole;
type CircleMessageForPolicy = WithSenderId<CircleMessage> & {
  circleId: string;
};

const circleRegistry = {
  circles: {
    datatype: {} as CircleForPolicy,
    action: ["create", "read", "update", "delete", "join", "invite"],
  },
  circleMembers: {
    datatype: {} as CircleMemberForPolicy,
    action: ["add", "remove", "updateRole", "view"],
  },
  circleMessages: {
    datatype: {} as CircleMessageForPolicy,
    action: ["send", "read", "delete"],
  },
} as const;

type CircleRegistry = typeof circleRegistry;

export { circleRegistry, type CircleRegistry };
