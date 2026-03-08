import { AvatarFallback } from "@radix-ui/react-avatar";
import { List, Users, Settings } from "lucide-react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getCircleInitials } from "@/utils/getInitials.util";
import type { StudyCircle } from "@/zodSchemas/circle.zod";

interface MobileHeaderProps {
  selectedCircle?: StudyCircle;
  showRightSidebar: boolean;
  onMenuClick: () => void;
  onMembersClick: () => void;
  onSettingsClick?: () => void;
  isLeftSidebarOpen: boolean;
}

export const MobileHeader = ({
  selectedCircle,
  showRightSidebar,
  onMenuClick,
  onMembersClick,
  onSettingsClick,
  isLeftSidebarOpen,
}: MobileHeaderProps) => (
  <div className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between gap-2 px-3 py-8 z-50">
    {/* Back button */}
    <button
      onClick={onMenuClick}
      className={cn("p-2 rounded-lg hover:bg-muted shrink-0")}
      aria-label="Back to groups"
    >
      <List className="h-5 w-5" />
    </button>

    {/* Circle info - truncates when too long */}
    <div className="flex items-center gap-2 min-w-0 flex-1">
      {selectedCircle ? (
        <>
          {/* Avatar */}
          <Avatar>
            <AvatarImage src={selectedCircle.avatar?.url} />
            <AvatarFallback>
              {getCircleInitials(selectedCircle.name)}
            </AvatarFallback>
          </Avatar>
          {/* Circle name with truncation */}
          <span className="font-semibold truncate">{selectedCircle.name}</span>
        </>
      ) : (
        <span className="font-semibold truncate">Study Circles</span>
      )}
    </div>

    {/* Action buttons */}
    <div className="flex items-center gap-1 shrink-0">
      {selectedCircle && (
        <>
          {/* Members button */}
          <button
            onClick={onMembersClick}
            disabled={isLeftSidebarOpen}
            className={cn(
              "p-2 rounded-lg",
              isLeftSidebarOpen && "cursor-not-allowed opacity-50",
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
            className={cn(
              "p-2 rounded-lg hover:bg-muted",
              isLeftSidebarOpen && "cursor-not-allowed opacity-50",
            )}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  </div>
);
