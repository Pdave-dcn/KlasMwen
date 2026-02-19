import { Link } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useJoinChatGroupMutation } from "@/queries/chat";
import { getGroupInitials } from "@/utils/getInitials.util";
import type { ChatGroupForDiscovery } from "@/zodSchemas/chat.zod";

interface SuggestedGroupCardProps {
  group: ChatGroupForDiscovery;
}

export const SuggestedGroupCard = ({ group }: SuggestedGroupCardProps) => {
  const joinChatGroupMutation = useJoinChatGroupMutation();

  const isJoining =
    joinChatGroupMutation.isPending &&
    joinChatGroupMutation.variables === group.id;

  const isJoined =
    joinChatGroupMutation.isSuccess &&
    joinChatGroupMutation.variables === group.id;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 p-3 rounded-lg border bg-card/50 transition-all duration-200",
        "hover:bg-card hover:shadow-sm hover:border-primary/30",
        isJoined && "border-green-500/30 bg-green-50/30 dark:bg-green-950/10",
      )}
    >
      {/* Left: Avatar with trending indicator */}
      <div className="relative shrink-0">
        <Avatar>
          <AvatarImage src={group.avatar?.url} />
          <AvatarFallback>{getGroupInitials(group.name)}</AvatarFallback>
        </Avatar>
        {/* {group.isTrending && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
            <Flame className="w-3 h-3 text-white" />
          </div>
        )} */}
      </div>

      {/* Middle: Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="font-medium text-foreground text-sm truncate">
            {/* ACCESSIBILITY TRICK: The 'after:absolute after:inset-0' 
                makes the link area cover the entire card without 
                nesting other interactive elements inside it.
            */}
            <Link
              to={`/circles/${group.id}/preview`}
              className="focus:outline-none after:absolute after:inset-0"
            >
              {group.name}
            </Link>
          </h4>
          {/* {group.isTrending && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
            >
              🔥 Trending
            </Badge>
          )} */}
        </div>

        {/* Tags */}
        {group.tags && group.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3 relative z-10">
            {group.tags.slice(0, 6).map((tag) => (
              <Badge key={tag.name} variant="outline" className="text-primary">
                #{tag.name}
              </Badge>
            ))}
            {group.tags.length > 6 && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs text-muted-foreground">
                +{group.tags.length - 6} more
              </span>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground">
            {group.memberCount} members
          </span>
          {/* <PresenceIndicator activeCount={activeCount} /> */}
        </div>
      </div>

      {/* Right: Action */}
      <div className="shrink-0 relative z-10">
        {isJoined ? (
          <span className="text-xs font-medium text-green-600 dark:text-green-400 px-3">
            ✓ Joined
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.preventDefault(); // Prevents the Link click from firing
              joinChatGroupMutation.mutate(group.id);
            }}
            disabled={isJoining}
            className="h-8 px-4 text-xs"
          >
            {isJoining ? "Joining..." : "Join"}
          </Button>
        )}
      </div>
    </div>
  );
};
