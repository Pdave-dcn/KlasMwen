import type { StudyCircleRole as MemberRole } from "@/zodSchemas/circle.zod";

import { useCirclePermission } from "./useCirclePermission";

// ─── Types ───────────────────────────────────────────────────────────────────

type CircleResource = "circles" | "circleMembers" | "circleMessages";

type CircleActions = {
  circles: "create" | "read" | "update" | "delete" | "join" | "invite";
  circleMembers: "add" | "remove" | "updateRole" | "view";
  circleMessages: "send" | "read" | "delete";
};

interface CircleGateProps<R extends CircleResource> {
  /** The resource being guarded */
  resource: R;
  /** The action being guarded */
  action: CircleActions[R];
  /** Content to render when access is granted */
  children: React.ReactNode;
  /**
   * Optional fallback content to render when access is denied.
   * If omitted, nothing is rendered (null).
   */
  fallback?: React.ReactNode;
  /**
   * When true, uses `canDefinitely` instead of `can`.
   * Data-dependent permissions will be treated as denied.
   * Use this for actions that require unconditional permission.
   */
  strict?: boolean;
}

interface RoleGateProps {
  /** Minimum required role (OWNER > MODERATOR > MEMBER) */
  minRole: MemberRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ExactRoleGateProps {
  /** Only renders for this exact role */
  role: MemberRole | MemberRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// ─── Components ──────────────────────────────────────────────────────────────

/**
 * Renders `children` only when the current user has permission to perform
 * `action` on `resource` in the active circle.
 *
 * For data-dependent permissions (e.g. "delete own message") the gate is open
 * by default — the server will perform the authoritative check. Pass
 * `strict` to flip this behaviour.
 *
 * @example
 * // Hide the "Update circle" form section for MEMBERs
 * <CircleGate resource="circles" action="update">
 *   <GeneralSettingsForm />
 * </CircleGate>
 *
 * // Show a fallback instead of nothing
 * <CircleGate resource="circles" action="delete" fallback={<ReadOnlyBadge />}>
 *   <DeleteCircleButton />
 * </CircleGate>
 *
 * // Danger: require unconditional permission (no data-dependent pass-through)
 * <CircleGate resource="circleMembers" action="remove" strict>
 *   <BulkRemoveButton />
 * </CircleGate>
 */
export function CircleGate<R extends CircleResource>({
  resource,
  action,
  children,
  fallback = null,
  strict = false,
}: CircleGateProps<R>) {
  const { can, canDefinitely } = useCirclePermission();
  const allowed = strict
    ? canDefinitely(resource, action)
    : can(resource, action);

  return allowed ? <>{children}</> : <>{fallback}</>;
}

/**
 * Renders `children` only when the current user's role is at least `minRole`.
 *
 * @example
 * // Show moderation tab only to OWNER and MODERATOR
 * <RoleGate minRole="MODERATOR">
 *   <ModerationTab />
 * </RoleGate>
 */
export function RoleGate({
  minRole,
  children,
  fallback = null,
}: RoleGateProps) {
  const { isAtLeast } = useCirclePermission();
  return isAtLeast(minRole) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Renders `children` only when the current user has exactly the specified role(s).
 *
 * @example
 * <ExactRoleGate role="OWNER">
 *   <TransferOwnershipButton />
 * </ExactRoleGate>
 *
 * <ExactRoleGate role={["OWNER", "MODERATOR"]}>
 *   <BanMemberButton />
 * </ExactRoleGate>
 */
export function ExactRoleGate({
  role,
  children,
  fallback = null,
}: ExactRoleGateProps) {
  const { role: currentRole } = useCirclePermission();
  const roles = Array.isArray(role) ? role : [role];
  const allowed = currentRole !== null && roles.includes(currentRole);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
