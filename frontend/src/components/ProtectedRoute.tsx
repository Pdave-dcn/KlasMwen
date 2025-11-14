import { Navigate } from "react-router-dom";

import type { Role } from "@/lib/permissions/types";
import { useAuthStore } from "@/stores/auth.store";

import Layout from "./layout/Layout";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: Role[];
};

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) return <Navigate to="/sign-in" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;
