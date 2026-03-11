import { useEffect } from "react";

import { useSearchParams } from "react-router-dom";

import { useCircleRoom } from "./useCircleRoom";
import { useCircleRoomSettings } from "./useCircleRoomSettings";
import { useSidebarState } from "./useSidebarState";

/**
 * Main hook for the Circle Room page.
 *
 * Pulls together everything the page needs — circle data, messages, members,
 * sidebar visibility, and settings — and returns it in one organized object.
 *
 * Also reads the URL on first load to auto-select a circle if one is provided
 * as a query parameter (e.g. /room?circle=abc123).
 */
export const useCircleRoomPage = () => {
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

  const { showSettings, setShowSettings } = useCircleRoomSettings();

  const useOverlay = isMobile || isTablet;

  // Handlers
  const handleCircleSelect = (circleId: string) => {
    handleSelectCircle(circleId);
    if (useOverlay) setShowLeftSidebar(false);
  };

  const handleToggleMembers = () => {
    setShowRightSidebar(!showRightSidebar);
  };

  const handleMenuClick = () => {
    setShowLeftSidebar(!showLeftSidebar);
    if (showRightSidebar) setShowRightSidebar(false);
  };

  const handleCloseOverlay = () => {
    setShowLeftSidebar(false);
    setShowRightSidebar(false);
  };

  useEffect(() => {
    const circleId = searchParams.get("circle");
    if (circleId) handleCircleSelect(circleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // Circle data
    circle: {
      selected: selectedCircle,
      selectedId: selectedCircleId,
      groups,
      messages,
      members,
      isMuted,
      onSelect: handleCircleSelect,
      onSendMessage: handleSendMessage,
    },

    // Current user
    user: {
      current: currentUser,
    },

    // Loading states
    loading: {
      circles: isLoadingCircles,
      messages: isLoadingMessages,
      members: isLoadingMembers,
    },

    // Sidebar state & handlers
    sidebar: {
      showLeft: showLeftSidebar,
      showRight: showRightSidebar,
      useOverlay,
      onToggleMembers: handleToggleMembers,
      onMenuClick: handleMenuClick,
      onCloseOverlay: handleCloseOverlay,
    },

    // Settings
    settings: {
      isOpen: showSettings,
      onOpen: () => setShowSettings(true),
      onClose: () => setShowSettings(false),
    },
  };
};
