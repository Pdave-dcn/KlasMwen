import { cn } from "@/lib/utils";
import type { StudyCircle, CircleMember } from "@/zodSchemas/circle.zod";

import { MemberList } from "../MemberList/MemberList";

interface RightSidebarProps {
  selectedCircle?: StudyCircle;
  members: CircleMember[];
  pagination: {
    fetchNextPage: () => void;
    hasNextPage: boolean | undefined;
    isFetchingNextPage: boolean;
  };
  currentUserId?: string;
  isLoading: boolean;
  showRightSidebar: boolean;
  useOverlay: boolean;
}

export const RightSidebar = ({
  selectedCircle,
  members,
  pagination,
  currentUserId,
  isLoading,
  showRightSidebar,
  useOverlay,
}: RightSidebarProps) => (
  <div
    className={cn(
      "bg-card border-l border-border shrink-0 transition-all duration-300",
      useOverlay
        ? cn(
            "fixed inset-y-0 right-0 w-72 z-40",
            useOverlay && "pt-14",
            showRightSidebar ? "translate-x-0" : "translate-x-full",
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
          pagination={pagination}
          isLoading={isLoading}
          currentUserId={currentUserId}
        />
      </>
    )}
  </div>
);
