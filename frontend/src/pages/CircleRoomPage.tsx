import { useEffect } from "react";

import { useSearchParams } from "react-router-dom";

import { cn } from "@/lib/utils";

import { LeftSidebar } from "../features/study-circles/room/components/CircleRoomLayout/LeftSidebar";
import { MobileHeader } from "../features/study-circles/room/components/CircleRoomLayout/MobileHeader";
import { MobileOverlay } from "../features/study-circles/room/components/CircleRoomLayout/MobileOverlay";
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
  } = useSidebarState(selectedCircleId);

  const handleCircleSelect = (circleId: string) => {
    handleSelectCircle(circleId);
    if (isMobile) {
      setShowLeftSidebar(false);
    }
  };

  const toggleMembers = () => {
    setShowRightSidebar(!showRightSidebar);
  };

  const handleMenuClick = () => {
    setShowLeftSidebar(true);
    setShowRightSidebar(false);
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

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden">
      {isMobile && (
        <MobileHeader
          selectedCircle={selectedCircle}
          showRightSidebar={showRightSidebar}
          onMenuClick={handleMenuClick}
          onMembersClick={toggleMembers}
        />
      )}

      <LeftSidebar
        circles={groups}
        selectedCircleId={selectedCircleId}
        onSelectCircle={handleCircleSelect}
        isLoading={isLoadingCircles}
        showLeftSidebar={showLeftSidebar}
        isMobile={isMobile}
      />

      <div className={cn("flex-1 flex flex-col min-w-0", isMobile && "pt-14")}>
        <CircleRoomView
          circle={selectedCircle}
          messages={messages}
          currentUserId={currentUser?.id ?? ""}
          isLoading={isLoadingMessages}
          isMuted={isMuted}
          isMobile={isMobile}
          onSendMessage={handleSendMessage}
          onToggleMembers={toggleMembers}
          showMembersButton={!isMobile}
        />
      </div>

      <RightSidebar
        selectedCircle={selectedCircle}
        members={members}
        currentUserId={currentUser?.id}
        isLoading={isLoadingMembers}
        showRightSidebar={showRightSidebar}
        isMobile={isMobile}
        onClose={() => setShowRightSidebar(false)}
      />

      {isMobile && (showLeftSidebar || showRightSidebar) && (
        <MobileOverlay onClose={closeOverlay} />
      )}
    </div>
  );
};

export default CircleRoomPage;
