import { Users, Settings, MessageCircle } from "lucide-react";

import { getGroupInitials } from "@/utils/getInitials.util";
import type { ChatGroup, ChatMessage } from "@/zodSchemas/chat.zod";

import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList/MessageList";

interface ChatRoomProps {
  group: ChatGroup | undefined;
  messages: ChatMessage[];
  currentUserId: string;
  isLoading: boolean;
  isMuted: boolean;
  isMobile: boolean;
  onSendMessage: (content: string) => void;
  onToggleMembers: () => void;
  showMembersButton?: boolean;
}

export const ChatRoom = ({
  group,
  messages,
  currentUserId,
  isLoading,
  isMuted,
  isMobile,
  onSendMessage,
  onToggleMembers,
  showMembersButton = true,
}: ChatRoomProps) => {
  if (!group) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-background text-muted-foreground">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-10 w-10 opacity-50" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Select a chat
          </h2>
          <p className="text-sm max-w-50">
            Choose a group from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      {!isMobile && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {getGroupInitials(group.name)}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-foreground truncate">
                {group.name}
              </h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {group.memberCount} members
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showMembersButton && (
              <button
                onClick={onToggleMembers}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Users className="h-5 w-5" />
              </button>
            )}
            <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        isLoading={isLoading}
      />

      {/* Input */}
      <MessageInput onSend={onSendMessage} isMuted={isMuted} />
    </div>
  );
};
