import { useEffect } from "react";

import { useSearchParams } from "react-router-dom";

import { useCircleStore } from "@/stores/circle.store";

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

  const { resetSelectedCircle } = useCircleStore();

  const {
    data,
    loading,
    pagination,
    selectedCircleId,
    currentUser,
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

    return () => {
      resetSelectedCircle();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // Circle data
    circle: {
      selected: data.selectedCircle,
      selectedId: selectedCircleId,
      groups: data.circles,
      messages: data.messages,
      members: data.members,
      isMuted,
      onSelect: handleCircleSelect,
      onSendMessage: handleSendMessage,
    },

    // Pagination
    pagination,

    // Current user
    user: {
      current: currentUser,
    },

    // Loading states
    loading: {
      circles: loading.circles,
      messages: loading.messages,
      members: loading.members,
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
