import { useState, useEffect } from "react";

import { Menu, X, Users } from "lucide-react";

import { cn } from "@/lib/utils";

import { useChat } from "../hooks/useChat";

import { ChatGroupList } from "./ChatGroupList";
import { ChatRoom } from "./ChatRoom";
import { MemberList } from "./MemberList";

export const ChatLayout = () => {
  const {
    groups,
    selectedGroup,
    selectedGroupId,
    messages,
    enrichedMembers,
    currentUser,
    isLoadingGroups,
    isLoadingMessages,
    isLoadingMembers,
    isMuted,
    handleSelectGroup,
    handleSendMessage,
  } = useChat();

  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setShowLeftSidebar(!selectedGroupId);
        setShowRightSidebar(false);
      } else if (window.innerWidth < 1024) {
        setShowRightSidebar(false);
      } else {
        setShowLeftSidebar(true);
        setShowRightSidebar(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [selectedGroupId]);

  const handleGroupSelect = (groupId: string) => {
    handleSelectGroup(groupId);
    if (isMobile) {
      setShowLeftSidebar(false);
    }
  };

  const toggleMembers = () => {
    setShowRightSidebar(!showRightSidebar);
  };

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-50">
          <button
            onClick={() => {
              setShowLeftSidebar(true);
              setShowRightSidebar(false);
            }}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>

          <span className="font-semibold">
            {selectedGroup?.name ?? "StudyChat"}
          </span>

          {selectedGroup && (
            <button
              onClick={toggleMembers}
              className={cn(
                "p-2 rounded-lg",
                showRightSidebar
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              <Users className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* Left Sidebar - Chat Groups */}
      <div
        className={cn(
          "bg-card border-r border-border shrink-0 transition-all duration-300",
          isMobile
            ? cn(
                "fixed inset-y-0 left-0 w-full z-40",
                isMobile && "pt-14",
                showLeftSidebar ? "translate-x-0" : "-translate-x-full",
              )
            : cn(
                "w-80",
                showLeftSidebar
                  ? "opacity-100"
                  : "w-0 opacity-0 overflow-hidden",
              ),
        )}
      >
        <ChatGroupList
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelectGroup={handleGroupSelect}
          isLoading={isLoadingGroups}
        />
      </div>

      {/* Main Chat Room */}
      <div className={cn("flex-1 flex flex-col min-w-0", isMobile && "pt-14")}>
        <ChatRoom
          group={selectedGroup}
          messages={messages}
          currentUserId={currentUser?.id ?? ""}
          isLoading={isLoadingMessages}
          isMuted={isMuted}
          onSendMessage={handleSendMessage}
          onToggleMembers={toggleMembers}
          showMembersButton={!isMobile}
        />
      </div>

      {/* Right Sidebar - Members */}
      <div
        className={cn(
          "bg-card border-l border-border shrink-0 transition-all duration-300",
          isMobile
            ? cn(
                "fixed inset-y-0 right-0 w-72 z-40",
                isMobile && "pt-14",
                showRightSidebar ? "translate-x-0" : "translate-x-full",
              )
            : cn(
                "w-72",
                showRightSidebar && selectedGroup
                  ? "opacity-100"
                  : "w-0 opacity-0 overflow-hidden",
              ),
        )}
      >
        {selectedGroup && (
          <>
            {isMobile && (
              <button
                onClick={() => setShowRightSidebar(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <MemberList
              members={enrichedMembers}
              isLoading={isLoadingMembers}
              currentUserId={currentUser?.id}
            />
          </>
        )}
      </div>

      {/* Mobile Overlay */}
      {isMobile && (showLeftSidebar || showRightSidebar) && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => {
            setShowLeftSidebar(false);
            setShowRightSidebar(false);
          }}
        />
      )}
    </div>
  );
};
