import { Users, Globe, Check } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useJoinChatGroupMutation } from "@/queries/chat.query";
import { getGroupInitials } from "@/utils/getInitials.util";
import type { ChatGroupForDiscovery } from "@/zodSchemas/chat.zod";

interface GroupDiscoveryCardProps {
  group: ChatGroupForDiscovery;
}

export function GroupDiscoveryCard({ group }: GroupDiscoveryCardProps) {
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
        "p-4 rounded-xl border bg-card transition-all duration-200",
        "hover:shadow-md hover:border-primary/30",
        isJoined && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar className="h-12 w-12">
          <AvatarImage src={group.avatar?.url} alt={group.name} />
          <AvatarFallback>{getGroupInitials(group.name)}</AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">
              {group.name}
            </h3>
            {!group.isPrivate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <Globe className="w-3 h-3" />
                Public
              </span>
            )}
          </div>

          {group.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {group.description}
            </p>
          )}

          {/* Tags */}
          {group.tags && group.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {group.tags.slice(0, 6).map((tag) => (
                <span
                  key={tag.name}
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent/50 text-accent-foreground text-xs font-medium"
                >
                  #{tag.name}
                </span>
              ))}
              {group.tags.length > 4 && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs text-muted-foreground">
                  +{group.tags.length - 4} more
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>
                {group.memberCount}{" "}
                {group.memberCount === 1 ? "member" : "members"}
              </span>
            </div>

            {isJoined ? (
              <div className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                <span>Joined</span>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => joinChatGroupMutation.mutate(group.id)}
                disabled={isJoining}
                className="h-8 px-4"
              >
                {isJoining ? "Joining..." : "Join"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
