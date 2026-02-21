import { Routes, Route } from "react-router-dom";

import {
  DiscoverGroupsPage,
  CreateGroupPage,
} from "@/features/study-circles/hub/components";
import CircleRoomPage from "@/features/study-circles/room/components/CircleRoomPage";
import AuthForm from "@/pages/AuthForm";
import CirclePreviewPage from "@/pages/CirclePreviewPage";
import CirclesHubPage from "@/pages/CirclesHubPage";
import DiscoverPage from "@/pages/DiscoverPage";
import HomePage from "@/pages/HomePage";
import LandingPage from "@/pages/LandingPage";
import ModDashboard from "@/pages/ModDashboard";
import NotFound from "@/pages/NotFound";
import Notifications from "@/pages/Notifications";
import PostView from "@/pages/PostView";
import Profile from "@/pages/Profile";
import ProfileEdit from "@/pages/ProfileEdit";
import Search from "@/pages/Search";
import SettingsPage from "@/pages/SettingsPage";

import ProtectedRoute from "./ProtectedRoute";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<AuthForm defaultMode="signup" />} />
      <Route path="/sign-in" element={<AuthForm />} />
      <Route path="/discover" element={<DiscoverPage />} />

      {/* Main App Routes */}
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

      {/* Profile Domain */}
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

      {/* Discovery & Settings */}
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

      {/* --- Study Circles Domain (/circles) --- */}
      <Route
        path="/circles"
        element={
          <ProtectedRoute>
            <CirclesHubPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/circles/mine"
        element={
          <ProtectedRoute>
            <CircleRoomPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/circles/discover"
        element={
          <ProtectedRoute>
            <DiscoverGroupsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/circles/create"
        element={
          <ProtectedRoute>
            <CreateGroupPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/circles/:id/preview"
        element={
          <ProtectedRoute>
            <CirclePreviewPage />
          </ProtectedRoute>
        }
      />

      {/* System Routes */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
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
