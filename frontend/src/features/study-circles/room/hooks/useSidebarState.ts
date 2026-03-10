import { useState, useEffect, useMemo } from "react";

import debounce from "lodash.debounce";

/**
 * Manages responsive sidebar state for the chat layout.
 *
 * This hook:
 * - Detects screen size changes
 * - Determines if the UI is in mobile mode
 * - Automatically shows or hides sidebars based on screen width
 * - Adjusts the left sidebar when a group is selected on mobile
 *
 * @param {string | null} selectedGroupId - ID of the currently selected group.
 * Used to hide the left sidebar on mobile when a chat is open.
 */
export const useSidebarState = (selectedGroupId: string | null) => {
  const initialWidth = window.innerWidth;
  const initialMobile = initialWidth < 768;
  const initialTablet = initialWidth >= 768 && initialWidth < 1024;

  const [isMobile, setIsMobile] = useState(initialMobile);
  const [isTablet, setIsTablet] = useState(initialTablet);
  const [showLeftSidebar, setShowLeftSidebar] = useState(
    initialMobile ? !selectedGroupId : true,
  );
  const [showRightSidebar, setShowRightSidebar] = useState(
    initialMobile || initialTablet ? false : true,
  );

  const debouncedCheckMobile = useMemo(
    () =>
      debounce(() => {
        const width = window.innerWidth;
        const mobile = width < 768;
        const tablet = width >= 768 && width < 1024;

        setIsMobile(mobile);
        setIsTablet(tablet);

        if (mobile) {
          setShowLeftSidebar(!selectedGroupId);
          setShowRightSidebar(false);
        } else if (tablet) {
          setShowLeftSidebar(true);
          setShowRightSidebar(false);
        } else {
          setShowLeftSidebar(true);
          setShowRightSidebar(true);
        }
      }, 150),
    [selectedGroupId],
  );

  useEffect(() => {
    window.addEventListener("resize", debouncedCheckMobile);
    return () => {
      window.removeEventListener("resize", debouncedCheckMobile);
      debouncedCheckMobile.cancel();
    };
  }, [debouncedCheckMobile]);

  return {
    showLeftSidebar,
    setShowLeftSidebar,
    showRightSidebar,
    setShowRightSidebar,
    isMobile,
    isTablet,
  };
};
