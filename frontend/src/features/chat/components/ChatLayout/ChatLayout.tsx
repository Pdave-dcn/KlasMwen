import { cn } from "@/lib/utils";

import { useChat } from "../../hooks/useChat";
import { useSidebarState } from "../../hooks/useSidebarState";
import { ChatRoom } from "../ChatRoom";

import { LeftSidebar } from "./LeftSidebar";
import { MobileHeader } from "./MobileHeader";
import { MobileOverlay } from "./MobileOverlay";
import { RightSidebar } from "./RightSidebar";

export const ChatLayout = () => {
  const {
    groups,
    selectedGroup,
    selectedGroupId,
    messages,
    members,
    currentUser,
    isLoadingGroups,
    isLoadingMessages,
    isLoadingMembers,
    isMuted,
    handleSelectGroup,
    handleSendMessage,
  } = useChat();

  const {
    showLeftSidebar,
    setShowLeftSidebar,
    showRightSidebar,
    setShowRightSidebar,
    isMobile,
  } = useSidebarState(selectedGroupId);

  const handleGroupSelect = (groupId: string) => {
    handleSelectGroup(groupId);
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

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden">
      {isMobile && (
        <MobileHeader
          selectedGroup={selectedGroup}
          showRightSidebar={showRightSidebar}
          onMenuClick={handleMenuClick}
          onMembersClick={toggleMembers}
        />
      )}

      <LeftSidebar
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={handleGroupSelect}
        isLoading={isLoadingGroups}
        showLeftSidebar={showLeftSidebar}
        isMobile={isMobile}
      />

      <div className={cn("flex-1 flex flex-col min-w-0", isMobile && "pt-14")}>
        <ChatRoom
          group={selectedGroup}
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
        selectedGroup={selectedGroup}
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
