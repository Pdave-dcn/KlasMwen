import { SearchX } from "lucide-react";

import { Button } from "../../../../../components/ui/button";

interface DiscoveryEmptyStateProps {
  isSearchActive: boolean;
  onClearSearch: () => void;
}

export function DiscoveryEmptyState({
  isSearchActive,
  onClearSearch,
}: DiscoveryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <SearchX className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {isSearchActive ? "No matching groups" : "No groups yet"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        {isSearchActive
          ? "We couldn't find any circles matching your search. Try different keywords or browse by category."
          : "No groups are available in this category right now. Check back later!"}
      </p>
      {isSearchActive && (
        <Button variant="outline" onClick={onClearSearch}>
          Clear Search
        </Button>
      )}
    </div>
  );
}
