export type MemberRole = "OWNER" | "MODERATOR" | "MEMBER";

export interface User {
  id: string;
  username: string;
  avatar?: string;
  isOnline?: boolean;
}

export interface ChatMember {
  id: string;
  user: User;
  role: MemberRole;
  isMuted: boolean;
  joinedAt: string;
}

export interface Message {
  id: string;
  content: string;
  sender: User;
  chatGroupId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: {
    content: string;
    senderName: string;
    createdAt: string;
  };
  unreadCount: number;
  memberCount: number;
  members?: ChatMember[];
}

export interface ChatState {
  groups: ChatGroup[];
  selectedGroupId: string | null;
  messages: Message[];
  members: ChatMember[];
  currentUser: User | null;
  isLoadingGroups: boolean;
  isLoadingMessages: boolean;
  isLoadingMembers: boolean;
  isMuted: boolean;
}
