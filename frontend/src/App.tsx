import { useEffect } from "react";

import { useNavigate, useLocation } from "react-router-dom";

import { Toaster } from "sonner";

import { AppRoutes } from "./components/AppRoutes";
import ScrollToTop from "./components/ScrollToTop";
import SplashScreen from "./components/SplashScreen";
import { useAuthInitialization } from "./hooks/useAuthInitialization";

const PROTECTED_ROUTES = [
  "/home",
  "/profile",
  "/search",
  "/settings",
  "/notifications",
  "/mod",
];

const PUBLIC_ROUTES = ["/", "/register", "/sign-in", "/discover"];

const App = () => {
  const authStatus = useAuthInitialization();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authStatus === "loading") return;

    const currentPath = location.pathname;
    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
      currentPath.startsWith(route)
    );
    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
      currentPath.startsWith(route)
    );

    if (authStatus === "authenticated" && isPublicRoute) {
      void navigate("/home", { replace: true });
    } else if (authStatus === "unauthenticated" && isProtectedRoute) {
      void navigate("/", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  if (authStatus === "loading") {
    return <SplashScreen />;
  }

  return (
    <>
      <ScrollToTop />
      <Toaster position="top-center" />
      <AppRoutes />
    </>
  );
};

export default App;
