import { cn } from "@/lib/utils";
import type { StudyCircle } from "@/zodSchemas/circle.zod";

import { CircleList } from "../ChatGroupList/CircleList";

interface LeftSidebarProps {
  circles: StudyCircle[];
  selectedCircleId: string | null;
  onSelectCircle: (id: string) => void;
  isLoading: boolean;
  showLeftSidebar: boolean;
  isMobile: boolean;
}

export const LeftSidebar = ({
  circles,
  selectedCircleId,
  onSelectCircle,
  isLoading,
  showLeftSidebar,
  isMobile,
}: LeftSidebarProps) => (
  <div
    className={cn(
      "bg-card border-r border-border shrink-0 transition-all duration-300",
      isMobile
        ? cn(
            "fixed inset-y-0 left-0 w-full z-40 pt-14",
            showLeftSidebar ? "translate-x-0" : "-translate-x-full",
          )
        : cn(
            "w-80",
            showLeftSidebar ? "opacity-100" : "w-0 opacity-0 overflow-hidden",
          ),
    )}
  >
    <CircleList
      circles={circles}
      selectedCircleId={selectedCircleId}
      onSelectCircle={onSelectCircle}
      isLoading={isLoading}
    />
  </div>
);
