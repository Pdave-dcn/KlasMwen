import { useNavigate } from "react-router-dom";

import { MessageCircle, Search, Plus } from "lucide-react";

import { SuggestedCirclesSection } from "@/features/study-circles/hub/components/SuggestedStudyCircle/SuggestedCirclesSection";

import { CircleHubCard } from "../features/study-circles/hub/components/CirclesHub/CircleHubCard";
import { QuickStatsBar } from "../features/study-circles/hub/components/QuickStatsBar";
import { RecentActivitySection } from "../features/study-circles/hub/components/RecentActivity/RecentActivitySection";

const CirclesHubPage = () => {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CircleHubCard
              title="My Groups"
              subtitle="Jump back into your conversations"
              icon={MessageCircle}
              variant="primary"
              onClick={() => navigate("/circles/mine")}
              classname="sm:col-span-2 lg:col-span-1"
            />

            <CircleHubCard
              title="Discover"
              subtitle="Find study circles"
              icon={Search}
              onClick={() => navigate("/circles/discover")}
            />

            <CircleHubCard
              title="Create"
              subtitle="Start a new group"
              icon={Plus}
              onClick={() => navigate("/circles/create")}
            />
          </div>
        </section>

        {/* Suggested Groups Section */}
        <SuggestedCirclesSection />
      </main>
    </div>
  );
};

export default CirclesHubPage;
