import { cn } from "@/lib/utils";
import type { StudyCircle, CircleMember } from "@/zodSchemas/circle.zod";

import { MemberList } from "../MemberList/MemberList";

interface RightSidebarProps {
  selectedCircle?: StudyCircle;
  members: CircleMember[];
  currentUserId?: string;
  isLoading: boolean;
  showRightSidebar: boolean;
  isMobile: boolean;
}

export const RightSidebar = ({
  selectedCircle,
  members,
  currentUserId,
  isLoading,
  showRightSidebar,
  isMobile,
}: RightSidebarProps) => (
  <div
    className={cn(
      "bg-card border-l border-border shrink-0 transition-all duration-300",
      isMobile
        ? cn(
            "fixed inset-y-0 right-0 w-72 z-40 pt-14",
            showRightSidebar && selectedCircle
              ? "translate-x-0"
              : "translate-x-full",
          )
        : cn(
            "w-72",
            showRightSidebar && selectedCircle
              ? "opacity-100"
              : "w-0 opacity-0 overflow-hidden",
          ),
    )}
  >
    {selectedCircle && (
      <>
        <MemberList
          members={members}
          isLoading={isLoading}
          currentUserId={currentUserId}
        />
      </>
    )}
  </div>
);
