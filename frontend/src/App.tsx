import { useEffect, useState } from "react";

import { Routes, Route } from "react-router-dom";

import { Toaster } from "sonner";

import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeToggle } from "./components/ThemeToggle";
import { Spinner } from "./components/ui/spinner";
import AuthForm from "./pages/AuthForm";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import { useAuthStore } from "./stores/auth.store";

const App = () => {
  const [isHydrated, setIsHydrated] = useState(false);

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

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="relative">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<AuthForm defaultMode="signup" />} />
          <Route path="/sign-in" element={<AuthForm />} />

          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
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

          <Route path="*" element={<NotFound />} />
        </Routes>
        <div className="fixed bottom-4 right-4 z-50">
          <ThemeToggle />
        </div>
      </div>
    </>
  );
};

export default App;
