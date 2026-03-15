import type { CircleMember } from "@/zodSchemas/circle.zod";

import { useModerationTab } from "../../hooks/useModerationTab";

import { ChatSettings } from "./ChatSettings";
import { ClearChatDialog } from "./ClearChatDialog";
import { MutedMembersList } from "./MutedMemberList";

interface ModerationTabProps {
  members: CircleMember[];
  slowMode: boolean;
  slowModeInterval: number;
}

export function ModerationTab({
  members,
  slowMode,
  slowModeInterval: _slowModeInterval,
}: ModerationTabProps) {
  const {
    slowMode: slowModeState,
    showClearConfirm,
    setShowClearConfirm,
    mutedMembers,
    handlers,
  } = useModerationTab({ members, initialSlowMode: slowMode });

  return (
    <div className="space-y-8">
      <MutedMembersList
        mutedMembers={mutedMembers}
        onUnmute={handlers.handleUnmute}
      />

      <ChatSettings
        slowMode={slowModeState}
        onSlowModeToggle={handlers.handleSlowModeToggle}
        onClearChatRequest={() => setShowClearConfirm(true)}
      />

      <ClearChatDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        onConfirm={handlers.handleClearChat}
      />
    </div>
  );
}
