import type { Role } from "@/lib/permissions/types";
import { useAuthStore } from "@/stores/auth.store";

interface RequireRoleProps {
  allowed: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const RequireRole = ({
  allowed,
  children,
  fallback = null,
}: RequireRoleProps) => {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;
  if (!allowed.includes(user.role)) return <>{fallback}</>;

  return <>{children}</>;
};

export default RequireRole;
