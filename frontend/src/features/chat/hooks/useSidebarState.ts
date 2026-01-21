import { useState, useEffect } from "react";

export const useSidebarState = (selectedGroupId: string | null) => {
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      const isTablet = window.innerWidth < 1024;

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
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [selectedGroupId]);

  return {
    showLeftSidebar,
    setShowLeftSidebar,
    showRightSidebar,
    setShowRightSidebar,
    isMobile,
  };
};
