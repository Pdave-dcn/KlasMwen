import { Navigate } from "react-router-dom";

import { useAuthStore } from "@/stores/auth.store";

import Layout from "./layout/Layout";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;
