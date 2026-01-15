import type { ChatGroup, ChatMessage, ChatRole } from "@prisma/client";

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
  role: ChatRole;
  userId?: string;
  user?: { id: string };
};

type ChatGroupForPolicy = WithCreatorId<ChatGroup>;
type ChatMemberForPolicy = WithMembershipRole;
type ChatMessageForPolicy = WithSenderId<ChatMessage> & {
  chatGroupId: string;
};

const chatRegistry = {
  chatGroups: {
    datatype: {} as ChatGroupForPolicy,
    action: ["create", "read", "update", "delete", "join", "invite"],
  },
  chatMembers: {
    datatype: {} as ChatMemberForPolicy,
    action: ["add", "remove", "updateRole", "view"],
  },
  chatMessages: {
    datatype: {} as ChatMessageForPolicy,
    action: ["send", "read", "delete"],
  },
} as const;

type ChatRegistry = typeof chatRegistry;

export { chatRegistry, type ChatRegistry };
