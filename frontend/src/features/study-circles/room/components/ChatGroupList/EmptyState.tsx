import { MessageCircle } from "lucide-react";

export const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
      <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
      <p className="text-sm">No chats found</p>
    </div>
  );
};
