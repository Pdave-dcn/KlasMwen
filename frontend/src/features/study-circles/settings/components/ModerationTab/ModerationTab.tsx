import { useModerationTab } from "../../hooks/useModerationTab";

import { ChatSettings } from "./ChatSettings";
import { ClearChatDialog } from "./ClearChatDialog";
import { MutedMembersList } from "./MutedMemberList";

interface ModerationTabProps {
  slowMode: boolean;
  slowModeInterval: number;
}

export function ModerationTab({
  slowMode,
  slowModeInterval: _slowModeInterval,
}: ModerationTabProps) {
  const {
    slowMode: slowModeState,
    showClearConfirm,
    setShowClearConfirm,
    mutedMembers,
    mutedTotal,
    pagination,
    handlers,
  } = useModerationTab({ initialSlowMode: slowMode });

  return (
    <div className="space-y-8">
      <MutedMembersList
        mutedMembers={mutedMembers}
        mutedTotal={mutedTotal}
        onUnmute={handlers.handleUnmute}
        pagination={pagination}
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
