import { useState } from "react";

import {
  ArrowLeft,
  Settings2,
  Users,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CircleMember, StudyCircle } from "@/zodSchemas/circle.zod";

import { RoleGate } from "../../security/CircleGate";
import { useCirclePermission } from "../../security/useCirclePermission";

import { DangerZoneTab } from "./DangerZoneTab";
import { GeneralTab } from "./GeneralTab";
import { MembersTab } from "./MembersTab/MembersTab";
import { ModerationTab } from "./ModerationTab";

import type { SettingsTab } from "../types";

interface CircleSettingsPanelProps {
  circle: StudyCircle;
  circleMembers: CircleMember[];
  onClose: () => void;
}

interface TabDef {
  id: SettingsTab;
  label: string;
  icon: typeof Settings2;
}

// All tabs are defined here — visibility is controlled by CircleGate / RoleGate
const tabs: TabDef[] = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "members", label: "Members", icon: Users },
  { id: "moderation", label: "Moderation", icon: Shield },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
];

export function CircleSettingsPanel({
  circle,
  circleMembers,
  onClose,
}: CircleSettingsPanelProps) {
  // Role is read from the store via the hook
  const { isAtLeast } = useCirclePermission();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  // Filter tabs based on role:
  // - "moderation" requires MODERATOR or above
  // - all other tabs are visible to all members
  const visibleTabs = tabs.filter((tab) => {
    if (tab.id === "moderation") return isAtLeast("MODERATOR");
    return true;
  });

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return (
          // Read is always allowed, but editing is gated inside GeneralTab.
          <GeneralTab circle={circle} />
        );

      case "members":
        return <MembersTab members={circleMembers} />;

      case "moderation":
        // Extra safety: if somehow a MEMBER lands here, render nothing
        return (
          <RoleGate minRole="MODERATOR">
            <ModerationTab
              members={circleMembers}
              slowMode={false}
              slowModeInterval={5}
            />
          </RoleGate>
        );

      case "danger":
        return <DangerZoneTab circleName={circle.name} onClose={onClose} />;

      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-background flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 md:px-6 h-14 border-b border-border bg-card shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">
            Circle Settings
          </h2>
          <p className="text-xs text-muted-foreground truncate">
            {circle.name}
          </p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Tabs (desktop) */}
        <nav className="hidden md:flex flex-col w-56 border-r border-border bg-card p-3 gap-1 shrink-0">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left w-full",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  tab.id === "danger" &&
                    activeTab === tab.id &&
                    "bg-destructive/10 text-destructive",
                  tab.id === "danger" &&
                    activeTab !== tab.id &&
                    "hover:text-destructive",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Mobile horizontal tabs */}
        <div
          className="md:hidden flex border-b border-border bg-card px-2 overflow-x-auto shrink-0 absolute left-0 right-0"
          style={{ top: "3.5rem" }}
        >
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground",
                  tab.id === "danger" &&
                    activeTab === tab.id &&
                    "border-destructive text-destructive",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-2xl mx-auto p-4 md:p-8 md:pt-8 pt-14">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
