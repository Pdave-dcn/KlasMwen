import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { ArrowLeft, Search, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useChatGroupsForDiscoveryQuery,
  useJoinChatGroupMutation,
} from "@/queries/chat.query";

import { GroupDiscoveryCard } from "./GroupDiscoveryCard";

export const DiscoverGroupsPage = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: discoveryGroups,
    isLoading,
    isError,
  } = useChatGroupsForDiscoveryQuery();

  const joinGroupMutation = useJoinChatGroupMutation();

  const groups = discoveryGroups?.pages.flatMap((page) => page.data) ?? [];

  // Filter groups based on search query
  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Failed to load groups
          </h2>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    );
  }

  const handleJoinGroup = (groupId: string) => {
    joinGroupMutation.mutate(groupId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/chat/hub")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">
                Discover Groups
              </h1>
              <p className="text-sm text-muted-foreground">
                Find study circles and public chats
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search groups by name or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
      </div>

      {/* Groups List */}
      <main className="max-w-4xl mx-auto px-4 pb-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">
              No groups found
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Try a different search term"
                : "No public groups available right now"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredGroups.map((group) => (
              <GroupDiscoveryCard
                key={group.id}
                group={group}
                onJoin={handleJoinGroup}
                isJoining={
                  joinGroupMutation.isPending &&
                  joinGroupMutation.variables === group.id
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
