import { useEffect, useState } from "react";

import { Routes, Route, useNavigate } from "react-router-dom";

import { Toaster } from "sonner";

import api from "./api/api";
import ProtectedRoute from "./components/ProtectedRoute";
import SplashScreen from "./components/SplashScreen";
import AuthForm from "./pages/AuthForm";
import DiscoverPage from "./pages/DiscoverPage";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import NotificationsPage from "./pages/NotificationsPage";
import PostView from "./pages/PostView";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import Search from "./pages/Search";
import SettingsPage from "./pages/SettingsPage";
import { useAuthStore } from "./stores/auth.store";
import { AuthVerificationResponseSchema } from "./zodSchemas/auth.zod";

const App = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    const hasPersistedState = useAuthStore.persist.hasHydrated();

    if (hasPersistedState) {
      setIsHydrated(true);
    } else {
      const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
        setIsHydrated(true);
      });

      const timeout = setTimeout(() => setIsHydrated(true), 1000);

      return () => {
        unsubscribe();
        clearTimeout(timeout);
      };
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const verifyAuth = async () => {
      try {
        const res = await api.get("/auth/me");
        const validatedData = AuthVerificationResponseSchema.parse(res.data);
        login(validatedData.user);
        await navigate("/home", { replace: true });
      } catch {
        logout();
        await navigate("/", { replace: true });
      } finally {
        setIsAuthenticated(true);
      }
    };

    void verifyAuth();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, login, logout]);

  if (!isHydrated || !isAuthenticated) {
    return <SplashScreen />;
  }

  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<AuthForm defaultMode="signup" />} />
        <Route path="/sign-in" element={<AuthForm />} />
        <Route path="/discover" element={<DiscoverPage />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/:username/post/:id"
          element={
            <ProtectedRoute>
              <PostView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/me"
          element={
            <ProtectedRoute>
              <Profile isSelf />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <ProfileEdit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
