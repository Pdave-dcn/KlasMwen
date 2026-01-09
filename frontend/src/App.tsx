import { useEffect, useRef } from "react";

import { useNavigate, useLocation } from "react-router-dom";

import { Toaster } from "sonner";

import { AppRoutes } from "./components/AppRoutes";
import SplashScreen from "./components/layout/SplashScreen";
import ScrollManager from "./components/ScrollManager";
import { useAuthInitialization } from "./hooks/useAuthInitialization";
import { useInitializeNotifications } from "./hooks/useInitializeNotifications";

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
  const hasCheckedAuth = useRef(false);

  // Only initialize notifications when authenticated
  useInitializeNotifications(authStatus === "authenticated");

  useEffect(() => {
    if (authStatus === "loading") return;

    // Only check once when auth is determined
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const currentPath = location.pathname;

    // Check protected routes first
    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
      currentPath.startsWith(route)
    );

    // For public routes, match exactly or ensure it's not a protected route
    const isPublicRoute = PUBLIC_ROUTES.some((route) => {
      if (route === "/") {
        // "/" only matches exactly "/", not "/home" or "/profile"
        return currentPath === "/";
      }
      return currentPath.startsWith(route);
    });

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
      <ScrollManager />
      <Toaster position="top-center" />
      <AppRoutes />
    </>
  );
};

export default App;
