import { Flame, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { PresenceIndicator } from "../PresenceIndicator";

export interface SuggestedGroup {
  id: string;
  name: string;
  description: string;
  tags: string[];
  memberCount: number;
  activeMembers: number;
  isTrending: boolean;
}

interface SuggestedGroupCardProps {
  group: SuggestedGroup;
  onJoin: (groupId: string) => void;
  isJoining?: boolean;
  isJoined?: boolean;
}

export const SuggestedGroupCard = ({
  group,
  onJoin,
  isJoining = false,
  isJoined = false,
}: SuggestedGroupCardProps) => {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg border bg-card/50 transition-all duration-200",
        "hover:bg-card hover:shadow-sm",
        isJoined && "border-green-500/30 bg-green-50/30 dark:bg-green-950/10",
      )}
    >
      {/* Left: Avatar with trending indicator */}
      <div className="relative shrink-0">
        <div className="w-11 h-11 rounded-lg bg-linear-to-br from-accent to-accent/70 flex items-center justify-center">
          <Users className="w-5 h-5 text-accent-foreground" />
        </div>
        {group.isTrending && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
            <Flame className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Middle: Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="font-medium text-foreground text-sm truncate">
            {group.name}
          </h4>
          {group.isTrending && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
            >
              🔥 Trending
            </Badge>
          )}
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 mb-1">
          {group.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] text-primary font-medium">
              #{tag}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground">
            {group.memberCount} members
          </span>
          <PresenceIndicator activeCount={group.activeMembers} />
        </div>
      </div>

      {/* Right: Action */}
      <div className="shrink-0">
        {isJoined ? (
          <span className="text-xs font-medium text-green-600 dark:text-green-400 px-3">
            ✓ Joined
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onJoin(group.id)}
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
