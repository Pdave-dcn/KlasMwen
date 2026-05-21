import { hasPermission } from "@/lib/permissions";
import type { registry } from "@/lib/permissions/types";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Check if the current user can perform an action on a resource.
 *
 * Returns false if the user is not logged in.
 *
 * @example
 * // Static check — no resource data needed
 * const canCreatePost = useCan('post', 'create');
 *
 * @example
 * // Ownership check — pass the resource to evaluate against
 * const canEditPost = useCan('post', 'update', postData);
 */
export const useCan = <R extends keyof typeof registry>(
  resource: R,
  action: (typeof registry)[R]["action"][number],
  data?: (typeof registry)[R]["datatype"],
) => {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return hasPermission(
    user,
    resource,
    action,
    data as (typeof registry)[R]["datatype"],
  );
};
