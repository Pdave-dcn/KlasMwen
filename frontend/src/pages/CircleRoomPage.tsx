import { useEffect } from "react";

import { useSearchParams } from "react-router-dom";

import { MobileTabletHeader } from "@/features/study-circles/room/components/CircleRoomLayout/MobileTabletHeader";
import { cn } from "@/lib/utils";

import { LeftSidebar } from "../features/study-circles/room/components/CircleRoomLayout/LeftSidebar";
import { MobileTabletOverlay } from "../features/study-circles/room/components/CircleRoomLayout/MobileOverlay";
import { RightSidebar } from "../features/study-circles/room/components/CircleRoomLayout/RightSidebar";
import { CircleRoomView } from "../features/study-circles/room/components/CircleRoomView";
import { useCircleRoom } from "../features/study-circles/room/hooks/useCircleRoom";
import { useSidebarState } from "../features/study-circles/room/hooks/useSidebarState";

const CircleRoomPage = () => {
  const [searchParams] = useSearchParams();

  const {
    groups,
    selectedCircle,
    selectedCircleId,
    messages,
    members,
    currentUser,
    isLoadingCircles,
    isLoadingMessages,
    isLoadingMembers,
    isMuted,
    handleSelectCircle,
    handleSendMessage,
  } = useCircleRoom();

  const {
    showLeftSidebar,
    setShowLeftSidebar,
    showRightSidebar,
    setShowRightSidebar,
    isMobile,
    isTablet,
  } = useSidebarState(selectedCircleId);

  const handleCircleSelect = (circleId: string) => {
    handleSelectCircle(circleId);
    if (isMobile || isTablet) {
      setShowLeftSidebar(false);
    }
  };

  const toggleMembers = () => {
    setShowRightSidebar(!showRightSidebar);
  };

  const handleMenuClick = () => {
    setShowLeftSidebar(!showLeftSidebar);
    if (showRightSidebar) {
      setShowRightSidebar(false);
    }
  };

  const closeOverlay = () => {
    setShowLeftSidebar(false);
    setShowRightSidebar(false);
  };

  useEffect(() => {
    const circleId = searchParams.get("circle");
    if (circleId) {
      handleCircleSelect(circleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useOverlay = isMobile || isTablet;

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden">
      {useOverlay && (
        <MobileTabletHeader
          onMembersClick={toggleMembers}
          onMenuClick={handleMenuClick}
          showRightSidebar={showRightSidebar}
          selectedCircle={selectedCircle}
        />
      )}

      <LeftSidebar
        circles={groups}
        selectedCircleId={selectedCircleId}
        onSelectCircle={handleCircleSelect}
        isLoading={isLoadingCircles}
        showLeftSidebar={showLeftSidebar}
        useOverlay={useOverlay}
      />

      <div
        className={cn("flex-1 flex flex-col min-w-0", useOverlay && "pt-14")}
      >
        <CircleRoomView
          circle={selectedCircle}
          messages={messages}
          currentUserId={currentUser?.id ?? ""}
          isLoading={isLoadingMessages}
          isMuted={isMuted}
          onSendMessage={handleSendMessage}
          onToggleMembers={toggleMembers}
          showMembersButton={!useOverlay}
        />
      </div>

      <RightSidebar
        selectedCircle={selectedCircle}
        members={members}
        currentUserId={currentUser?.id}
        isLoading={isLoadingMembers}
        showRightSidebar={showRightSidebar}
        useOverlay={useOverlay}
      />

      {useOverlay && (showLeftSidebar || showRightSidebar) && (
        <MobileTabletOverlay onClose={closeOverlay} />
      )}
    </div>
  );
};

export default CircleRoomPage;
