import { MessageSquare } from "lucide-react";

export const EmptyState = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
      <MessageSquare className="h-12 w-12 mb-4 opacity-30" />
      <p className="text-lg font-medium">No messages yet</p>
      <p className="text-sm">Be the first to say hello!</p>
    </div>
  );
};
