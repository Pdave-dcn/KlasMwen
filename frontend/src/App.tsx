import { useEffect } from "react";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import axios from "axios";

import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeToggle } from "./components/ThemeToggle";
import { ThemeProvider } from "./contexts/ThemeProvider";
import AuthForms from "./pages/AuthForms";
import HomePage from "./pages/HomePage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useAuthStore } from "./stores/auth.store";

const App = () => {
  const { login, logout } = useAuthStore();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await axios.get("/auth/me", {
          withCredentials: true,
        });

        login(response.data);
      } catch (error) {
        console.error("Auth verification failed:", error);
        logout();
      }
    };

    void verifyAuth();
  }, [login, logout]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <div className="relative">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/register"
              element={<AuthForms defaultMode="register" />}
            />
            <Route path="/sign-in" element={<AuthForms />} />

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
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
