import { hasPermission } from "@/lib/permissions";
import type { registry } from "@/lib/permissions/types";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Hook to check if the current user has permission to perform an action on a resource.
 *
 * @template R - The resource type from the permissions registry
 * @param {R} resource - The resource to check permissions for (e.g., 'post', 'comment', 'user')
 * @param {(typeof registry)[R]["action"][number]} action - The action to perform on the resource (e.g., 'create', 'read', 'update', 'delete')
 * @param {(typeof registry)[R]["datatype"]} [data] - Optional data context for permission checks (e.g., resource instance for ownership checks)
 * @returns {boolean} True if the user has permission, false otherwise (including when user is not authenticated)
 *
 * @example
 * // Check if user can create posts
 * const canCreatePost = useCan('post', 'create');
 *
 * @example
 * // Check if user can edit a specific post (with data context)
 * const canEditPost = useCan('post', 'update', postData);
 */
export const useCan = <R extends keyof typeof registry>(
  resource: R,
  action: (typeof registry)[R]["action"][number],
  data?: (typeof registry)[R]["datatype"]
) => {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return hasPermission(user, resource, action, data);
};
