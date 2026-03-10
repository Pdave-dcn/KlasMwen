import { Menu, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StudyCircle } from "@/zodSchemas/circle.zod";

interface MobileTabletHeaderProps {
  selectedCircle?: StudyCircle;
  showRightSidebar: boolean;
  onMenuClick: () => void;
  onMembersClick: () => void;
}

export const MobileTabletHeader = ({
  selectedCircle,
  showRightSidebar,
  onMenuClick,
  onMembersClick,
}: MobileTabletHeaderProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-50">
      <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-muted">
        <Menu className="h-5 w-5" />
      </button>

      <span className="font-semibold truncate">
        {selectedCircle?.name ?? "Study Circles"}
      </span>

      {selectedCircle ? (
        <button
          onClick={onMembersClick}
          className={cn(
            "p-2 rounded-lg",
            showRightSidebar
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted",
          )}
        >
          <Users className="h-5 w-5" />
        </button>
      ) : (
        <div className="w-9" />
      )}
    </div>
  );
};
