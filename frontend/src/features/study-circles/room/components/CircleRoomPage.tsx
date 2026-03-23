import { MobileTabletHeader } from "@/features/study-circles/room/components/CircleRoomLayout/MobileTabletHeader";
import { useCircleRoomPage } from "@/features/study-circles/room/hooks/useCircleRoomPage";
import { CircleSettingsPanel } from "@/features/study-circles/settings/components/CircleSettingsPanel";
import { cn } from "@/lib/utils";

import { LeftSidebar } from "./CircleRoomLayout/LeftSidebar";
import { MobileTabletOverlay } from "./CircleRoomLayout/MobileOverlay";
import { RightSidebar } from "./CircleRoomLayout/RightSidebar";
import { CircleRoomView } from "./CircleRoomView";

const CircleRoomPage = () => {
  const { circle, loading, settings, sidebar, user, pagination } =
    useCircleRoomPage();

  return (
    <div className="relative h-screen w-full flex bg-background overflow-hidden">
      {sidebar.useOverlay && (
        <MobileTabletHeader
          onMembersClick={sidebar.onToggleMembers}
          onMenuClick={sidebar.onMenuClick}
          showRightSidebar={sidebar.showRight}
          selectedCircle={circle.selected}
        />
      )}

      <LeftSidebar
        circles={circle.groups}
        selectedCircleId={circle.selectedId}
        onSelectCircle={circle.onSelect}
        isLoading={loading.circles}
        showLeftSidebar={sidebar.showLeft}
        useOverlay={sidebar.useOverlay}
      />

      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          sidebar.useOverlay && "pt-14",
        )}
      >
        <CircleRoomView
          circle={circle.selected}
          messages={circle.messages}
          currentUserId={user.current?.id ?? ""}
          isLoading={loading.messages}
          isMuted={circle.isMuted}
          onSendMessage={circle.onSendMessage}
          onToggleMembers={sidebar.onToggleMembers}
          pagination={pagination.messages}
          showMembersButton={!sidebar.useOverlay}
          onOpen={settings.onOpen}
        />
      </div>

      <RightSidebar
        selectedCircle={circle.selected}
        members={circle.members}
        pagination={pagination.members}
        currentUserId={user.current?.id}
        isLoading={loading.members}
        showRightSidebar={sidebar.showRight}
        useOverlay={sidebar.useOverlay}
      />

      {sidebar.useOverlay && (sidebar.showLeft || sidebar.showRight) && (
        <MobileTabletOverlay onClose={sidebar.onCloseOverlay} />
      )}

      {settings.isOpen && circle.selected && (
        <CircleSettingsPanel
          circle={circle.selected}
          circleMembers={circle.members}
          onClose={settings.onClose}
        />
      )}
    </div>
  );
};

export default CircleRoomPage;
