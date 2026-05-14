import { Loader2, MessageCircle, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type JoinButtonProps = {
  isJoined: boolean;
  isJoining: boolean;
  onJoin: () => void;
  onLaunch: () => void;
  className?: string;
};

export const JoinButton = ({
  isJoined,
  isJoining,
  onJoin,
  onLaunch,
  className,
}: JoinButtonProps) => {
  if (isJoined) {
    return (
      <Button
        size="lg"
        className={cn("rounded-xl text-sm font-semibold", className)}
        onClick={onLaunch}
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Launch Chat
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className={cn("rounded-xl text-sm font-semibold", className)}
      onClick={onJoin}
      disabled={isJoining}
    >
      {isJoining ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Users className="w-4 h-4 mr-2" />
      )}
      {isJoining ? "Joining..." : "Join Group"}
    </Button>
  );
};
