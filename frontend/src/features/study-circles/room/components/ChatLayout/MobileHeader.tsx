import { ArrowLeft, Users, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { getGroupInitials } from "@/utils/getInitials.util";
import type { ChatGroup } from "@/zodSchemas/chat.zod";

interface MobileHeaderProps {
  selectedGroup?: ChatGroup;
  showRightSidebar: boolean;
  onMenuClick: () => void;
  onMembersClick: () => void;
  onSettingsClick?: () => void;
}

export const MobileHeader = ({
  selectedGroup,
  showRightSidebar,
  onMenuClick,
  onMembersClick,
  onSettingsClick,
}: MobileHeaderProps) => (
  <div className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between gap-2 px-3 py-8 z-50">
    {/* Back button */}
    <button
      onClick={onMenuClick}
      className="p-2 rounded-lg hover:bg-muted shrink-0"
      aria-label="Back to groups"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>

    {/* Group info - truncates when too long */}
    <div className="flex items-center gap-2 min-w-0 flex-1">
      {selectedGroup ? (
        <>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-primary">
              {getGroupInitials(selectedGroup.name)}
            </span>
          </div>
          {/* Group name with truncation */}
          <span className="font-semibold truncate">{selectedGroup.name}</span>
        </>
      ) : (
        <span className="font-semibold truncate">Study Circles</span>
      )}
    </div>

    {/* Action buttons */}
    <div className="flex items-center gap-1 shrink-0">
      {selectedGroup && (
        <>
          {/* Members button */}
          <button
            onClick={onMembersClick}
            className={cn(
              "p-2 rounded-lg",
              showRightSidebar
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
            aria-label="Toggle members"
          >
            <Users className="h-5 w-5" />
          </button>

          {/* Settings button */}
          <button
            onClick={() => {
              if (onSettingsClick) onSettingsClick();
            }}
            className="p-2 rounded-lg hover:bg-muted"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  </div>
);
