import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChatGroup, EnrichedChatMember } from "@/zodSchemas/chat.zod";

import { MemberList } from "../MemberList/MemberList";

interface RightSidebarProps {
  selectedGroup?: ChatGroup;
  enrichedMembers: EnrichedChatMember[];
  currentUserId?: string;
  isLoading: boolean;
  showRightSidebar: boolean;
  isMobile: boolean;
  onClose: () => void;
}

export const RightSidebar = ({
  selectedGroup,
  enrichedMembers,
  currentUserId,
  isLoading,
  showRightSidebar,
  isMobile,
  onClose,
}: RightSidebarProps) => (
  <div
    className={cn(
      "bg-card border-l border-border shrink-0 transition-all duration-300",
      isMobile
        ? cn(
            "fixed inset-y-0 right-0 w-72 z-40 pt-14",
            showRightSidebar ? "translate-x-0" : "translate-x-full",
          )
        : cn(
            "w-72",
            showRightSidebar && selectedGroup
              ? "opacity-100"
              : "w-0 opacity-0 overflow-hidden",
          ),
    )}
  >
    {selectedGroup && (
      <>
        {isMobile && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <MemberList
          members={enrichedMembers}
          isLoading={isLoading}
          currentUserId={currentUserId}
        />
      </>
    )}
  </div>
);
