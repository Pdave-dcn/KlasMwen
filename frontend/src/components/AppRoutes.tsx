import { Routes, Route } from "react-router-dom";

import AuthForm from "@/pages/AuthForm";
import DiscoverPage from "@/pages/DiscoverPage";
import HomePage from "@/pages/HomePage";
import LandingPage from "@/pages/LandingPage";
import ModDashboard from "@/pages/ModDashboard";
import NotFound from "@/pages/NotFound";
import NotificationsPage from "@/pages/NotificationsPage";
import PostView from "@/pages/PostView";
import Profile from "@/pages/Profile";
import ProfileEdit from "@/pages/ProfileEdit";
import Search from "@/pages/Search";
import SettingsPage from "@/pages/SettingsPage";

import ProtectedRoute from "./ProtectedRoute";

export const AppRoutes = () => {
  return (
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

      <Route
        path="/mod/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "MODERATOR"]}>
            <ModDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
