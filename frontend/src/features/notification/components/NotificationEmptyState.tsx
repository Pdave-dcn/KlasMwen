import { BellOff, Inbox } from "lucide-react";

interface NotificationEmptyStateProps {
  hasFilters: boolean;
}

export const NotificationEmptyState = ({
  hasFilters,
}: NotificationEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        {hasFilters ? (
          <Inbox className="h-8 w-8 text-muted-foreground" />
        ) : (
          <BellOff className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <h3 className="text-lg font-medium text-foreground">
        {hasFilters ? "No matching notifications" : "No notifications yet"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? "Try adjusting your filters to see more notifications."
          : "When someone interacts with your content, you'll see it here."}
      </p>
    </div>
  );
};
