import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { Sparkles, ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

import { SuggestedGroupCard, type SuggestedGroup } from "./SuggestedGroupCard";

interface SuggestedGroupsSectionProps {
  groups: SuggestedGroup[];
  isLoading?: boolean;
  onJoin: (groupId: string) => Promise<void>;
}

export function SuggestedGroupsSection({
  groups,
  isLoading = false,
  onJoin,
}: SuggestedGroupsSectionProps) {
  const navigate = useNavigate();
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  const handleJoin = async (groupId: string) => {
    setJoiningId(groupId);
    try {
      await onJoin(groupId);
      setJoinedIds((prev) => new Set(prev).add(groupId));
    } finally {
      setJoiningId(null);
    }
  };

  if (isLoading) {
    return (
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">
            Suggested for You
          </h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">
            Suggested for You
          </h3>
        </div>
        <button
          onClick={() => navigate("/chat/groups/discover")}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          Discover more
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2">
        {groups.map((group) => (
          <SuggestedGroupCard
            key={group.id}
            group={group}
            onJoin={handleJoin}
            isJoining={joiningId === group.id}
            isJoined={joinedIds.has(group.id)}
          />
        ))}
      </div>
    </section>
  );
}
