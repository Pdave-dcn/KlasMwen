import { useEffect, useState } from "react";

import { Routes, Route, useNavigate } from "react-router-dom";

import axios from "axios";
import { Toaster } from "sonner";

import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeToggle } from "./components/ThemeToggle";
import { Spinner } from "./components/ui/spinner";
import { ThemeProvider } from "./contexts/ThemeProvider";
import AuthForm from "./pages/AuthForm";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import { useAuthStore } from "./stores/auth.store";

const App = () => {
  const { login, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await axios.get("/auth/me");
        login(response.data.user);

        if (
          window.location.pathname === "/" ||
          window.location.pathname === "/sign-in" ||
          window.location.pathname === "/register"
        ) {
          await navigate("/home", { replace: true });
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    // don’t re-run if already logged out
    if (useAuthStore.getState().isAuthenticated) {
      void verifyAuth();
    } else {
      setIsLoading(false);
    }
  }, [login, logout, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
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

          <Route path="*" element={<NotFound />} />
        </Routes>
        <div className="fixed bottom-4 right-4 z-50">
          <ThemeToggle />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;
