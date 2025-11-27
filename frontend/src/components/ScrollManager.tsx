import { useEffect, useRef } from "react";

import { useLocation } from "react-router-dom";

const ScrollManager = () => {
  const { pathname } = useLocation();

  // store past scroll positions
  const scrollPositions = useRef<Record<string, number>>({});

  // detect the scrollable container
  const getContainer = () =>
    document.getElementById("app-scroll-container") ?? window;

  // save scroll position on unmount or route change
  useEffect(() => {
    const container = getContainer();

    const saveScroll = () => {
      const y =
        container instanceof Window ? window.scrollY : container.scrollTop;

      scrollPositions.current[pathname] = y;
    };

    container.addEventListener("scroll", saveScroll);

    return () => {
      container.removeEventListener("scroll", saveScroll);
      saveScroll(); // ensure it's saved on route change
    };
  }, [pathname]);

  // scroll to saved position or top on pathname change
  useEffect(() => {
    const container = getContainer();

    const saved = scrollPositions.current[pathname];

    const scrollTo = (top: number) => {
      if (container instanceof Window) {
        window.scrollTo({ top, behavior: "smooth" });
      } else {
        container.scrollTo({ top, behavior: "smooth" });
      }
    };

    // Case 1: restored scroll position (back/forward)
    if (saved !== undefined) {
      scrollTo(saved);
    }
    // Case 2: new page → scroll to top
    else {
      scrollTo(0);
    }
  }, [pathname]);

  return null;
};

export default ScrollManager;
