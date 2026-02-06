import { useNavigate } from "react-router-dom";

import { MessageCircle, Search, Plus } from "lucide-react";

import { ChatHubCard } from "../features/study-circles/hub/components/ChatHub/ChatHubCard";
import { QuickStatsBar } from "../features/study-circles/hub/components/QuickStatsBar";
import { RecentActivitySection } from "../features/study-circles/hub/components/RecentActivity/RecentActivitySection";
import { SuggestedGroupsSection } from "../features/study-circles/hub/components/SuggestedGroup/SuggestedGroupsSection";

const ChatHubPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-8">
          <QuickStatsBar />
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
        <SuggestedGroupsSection />
      </main>
    </div>
  );
};

export default ChatHubPage;
