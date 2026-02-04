import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { MessageCircle, Search, Plus } from "lucide-react";

import { chatHubApi } from "../../services/chatHubApi";
import { QuickStatsBar } from "../QuickStatsBar";
import { RecentActivitySection } from "../RecentActivity/RecentActivitySection";
import { SuggestedGroupsSection } from "../SuggestedGroup/SuggestedGroupsSection";

import { ChatHubCard } from "./ChatHubCard";

import type { SuggestedGroup } from "../SuggestedGroup/SuggestedGroupCard";

export function ChatHubPage() {
  const navigate = useNavigate();

  // State for dynamic data
  const [suggestedGroups, setSuggestedGroups] = useState<SuggestedGroup[]>([]);
  const [stats, setStats] = useState({
    activeGroups: 0,
    unreadMessages: 0,
    studyPartners: 0,
  });
  const [isLoadingSuggested, setIsLoadingSuggested] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [_recent, suggested, quickStats] = await Promise.all([
          chatHubApi.fetchRecentGroups(),
          chatHubApi.fetchSuggestedGroups(),
          chatHubApi.fetchQuickStats(),
        ]);
        setSuggestedGroups(suggested);
        setStats(quickStats);
      } catch (error) {
        console.error("Failed to load hub data:", error);
      } finally {
        setIsLoadingSuggested(false);
      }
    };
    void loadData();
  }, []);

  const handleJoinSuggested = async (groupId: string) => {
    await chatHubApi.joinGroup(groupId);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-8">
          <QuickStatsBar
            activeGroups={stats.activeGroups}
            unreadMessages={stats.unreadMessages}
            studyPartners={stats.studyPartners}
          />
        </div>

        {/* Recent Activity Section */}
        <RecentActivitySection />

        {/* Action Cards Grid */}
        <section className="mb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Quick Actions
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <ChatHubCard
              title="My Groups"
              subtitle="Jump back into your conversations"
              icon={MessageCircle}
              variant="primary"
              onClick={() => navigate("/chat/groups")}
            />

            <ChatHubCard
              title="Discover"
              subtitle="Find study circles"
              icon={Search}
              onClick={() => navigate("/chat/groups/discover")}
            />

            <ChatHubCard
              title="Create"
              subtitle="Start a new group"
              icon={Plus}
              onClick={() => navigate("/chat/groups/create")}
            />
          </div>
        </section>

        {/* Suggested Groups Section */}
        <SuggestedGroupsSection
          groups={suggestedGroups}
          isLoading={isLoadingSuggested}
          onJoin={handleJoinSuggested}
        />
      </main>
    </div>
  );
}
