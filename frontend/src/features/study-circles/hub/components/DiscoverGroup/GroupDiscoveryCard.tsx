import { Users, Globe, Check } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useJoinChatGroupMutation } from "@/queries/chat";
import { getGroupInitials } from "@/utils/getInitials.util";
import type { ChatGroupForDiscovery } from "@/zodSchemas/chat.zod";

import type { DiscoveryCategory } from "../../hooks/useGroupDiscoveryCategory";

interface GroupDiscoveryCardProps {
  group: ChatGroupForDiscovery;
  category?: DiscoveryCategory;
}

const getCategoryBadge = (category?: DiscoveryCategory) => {
  switch (category) {
    case "new":
      return {
        label: "New",
        className:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
      };
    case "trending":
      return {
        label: "🔥 Trending",
        className:
          "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
      };
    case "small":
      return {
        label: "Cozy",
        className:
          "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
      };
    default:
      return null;
  }
};

export const GroupDiscoveryCard = ({
  group,
  category,
}: GroupDiscoveryCardProps) => {
  const joinChatGroupMutation = useJoinChatGroupMutation();

  const isJoining =
    joinChatGroupMutation.isPending &&
    joinChatGroupMutation.variables === group.id;

  const isJoined =
    joinChatGroupMutation.isSuccess &&
    joinChatGroupMutation.variables === group.id;

  const badge = getCategoryBadge(category);

  return (
    <div
      className={cn(
        "p-3 sm:p-4 rounded-xl border bg-card transition-all duration-200",
        "hover:shadow-md hover:border-primary/30",
        isJoined && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Avatar - smaller on mobile */}
        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
          <AvatarImage src={group.avatar?.url} alt={group.name} />
          <AvatarFallback>{getGroupInitials(group.name)}</AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">
              {group.name}
            </h3>
            {!group.isPrivate && (
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                <Globe className="w-3 h-3" />
                <span className="hidden xs:inline">Public</span>
              </span>
            )}
            {badge && (
              <span
                className={cn(
                  "inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0",
                  badge.className,
                )}
              >
                {badge.label}
              </span>
            )}
          </div>

          {group.description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">
              {group.description}
            </p>
          )}

          {/* Tags */}
          {group.tags && group.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {group.tags.slice(0, 4).map((tag) => (
                <Badge key={tag.name} variant="secondary" className="text-xs">
                  #{tag.name}
                </Badge>
              ))}
              {group.tags.length > 4 && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs text-muted-foreground">
                  +{group.tags.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Footer - stack on mobile, row on desktop */}
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>
                  {group.memberCount}{" "}
                  {group.memberCount === 1 ? "member" : "members"}
                </span>
              </div>
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
                className="h-8 px-3 sm:px-4 text-sm w-full xs:w-auto"
              >
                {isJoining ? "Joining..." : "Join"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
