import { Link } from "react-router-dom";

import { Users, Globe, Check } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useJoinCircleMutation } from "@/queries/circle";
import { getGroupInitials } from "@/utils/getInitials.util";
import type { ChatGroupForDiscovery } from "@/zodSchemas/chat.zod";

import type { DiscoveryCategory } from "../../hooks/useCircleDiscoveryCategory";

interface CircleDiscoveryCardProps {
  circle: ChatGroupForDiscovery;
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

export const CircleDiscoveryCard = ({
  circle,
  category,
}: CircleDiscoveryCardProps) => {
  const joinChatGroupMutation = useJoinCircleMutation();

  const isJoining =
    joinChatGroupMutation.isPending &&
    joinChatGroupMutation.variables === circle.id;

  const isJoined =
    joinChatGroupMutation.isSuccess &&
    joinChatGroupMutation.variables === circle.id;

  const badge = getCategoryBadge(category);

  return (
    <div
      className={cn(
        "group relative p-3 sm:p-4 rounded-xl border bg-card transition-all duration-200",
        "hover:shadow-md hover:border-primary/30",
        isJoined && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Avatar - smaller on mobile */}
        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
          <AvatarImage src={circle.avatar?.url} alt={circle.name} />
          <AvatarFallback>{getGroupInitials(circle.name)}</AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">
              {/* ACCESSIBILITY: Stretched link pattern */}
              <Link
                to={`/circles/${circle.id}/preview`}
                className="focus:outline-none after:absolute after:inset-0"
              >
                {circle.name}
              </Link>
            </h3>

            <div className="flex items-center gap-2 relative z-10">
              {!circle.isPrivate && (
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                  <Globe className="w-3 h-3" />
                  <span className="hidden xs:inline">Public</span>
                </span>
              )}
              {badge && (
                <span
                  className={cn(
                    "inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
                    badge.className,
                  )}
                >
                  {badge.label}
                </span>
              )}
            </div>
          </div>

          {circle.description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">
              {circle.description}
            </p>
          )}

          {circle.tags && circle.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 relative z-10">
              {circle.tags.slice(0, 4).map((tag) => (
                <Badge key={tag.name} variant="secondary" className="text-xs">
                  #{tag.name}
                </Badge>
              ))}
              {circle.tags.length > 4 && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs text-muted-foreground">
                  +{circle.tags.length - 4} more
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 relative z-10">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>
                  {circle.memberCount}{" "}
                  {circle.memberCount === 1 ? "member" : "members"}
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
                onClick={(e) => {
                  e.preventDefault();
                  joinChatGroupMutation.mutate(circle.id);
                }}
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
