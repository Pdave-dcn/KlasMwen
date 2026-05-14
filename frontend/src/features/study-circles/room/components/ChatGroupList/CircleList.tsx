import { useState } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { StudyCircle } from "@/zodSchemas/circle.zod";

import { CircleListItem } from "./CircleListItem";
import { EmptyState } from "./EmptyState";
import { Header } from "./Header";
import { LoadingState } from "./LoadingState";

interface ChatGroupListProps {
  circles: StudyCircle[];
  selectedCircleId: string | null;
  onSelectCircle: (circleId: string) => void;
  isLoading: boolean;
  isFetching: boolean;
}

export const CircleList = ({
  circles,
  selectedCircleId,
  onSelectCircle,
  isLoading,
  isFetching,
}: ChatGroupListProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCircles = circles.filter((circle) =>
    circle.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const isLoadingState =
    isLoading || (isFetching && filteredCircles.length === 0);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="flex-1 min-h-0 w-full relative">
        <ScrollArea className="h-full w-full">
          <div className="p-2 w-full inline-table table-fixed min-w-0">
            {isLoadingState ? (
              <LoadingState />
            ) : filteredCircles.length > 0 ? (
              <div className="flex flex-col gap-1 w-full min-w-0">
                {filteredCircles.map((circle) => (
                  <CircleListItem
                    key={circle.id}
                    circle={circle}
                    isSelected={circle.id === selectedCircleId}
                    onClick={() => onSelectCircle(circle.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
