import { useState, useEffect, useMemo } from "react";

import debounce from "lodash.debounce";

export const useSidebarState = (selectedGroupId: string | null) => {
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const debouncedCheckMobile = useMemo(
    () =>
      debounce(() => {
        const width = window.innerWidth;
        const mobile = width < 768;
        const isTablet = width < 1024;

        setIsMobile(mobile);

        if (mobile) {
          setShowLeftSidebar(!selectedGroupId);
          setShowRightSidebar(false);
        } else if (isTablet) {
          setShowRightSidebar(false);
        } else {
          setShowLeftSidebar(true);
          setShowRightSidebar(true);
        }
      }, 150),
    [selectedGroupId],
  );

  useEffect(() => {
    // Run immediately on mount
    const initialWidth = window.innerWidth;
    setIsMobile(initialWidth < 768);

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
  };
};
