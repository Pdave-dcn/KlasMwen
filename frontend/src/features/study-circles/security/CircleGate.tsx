import type { StudyCircleRole as MemberRole } from "@/zodSchemas/circle.zod";

import {
  useCirclePermission,
  type CircleActions,
  type CircleResource,
  type ResourceData,
} from "./useCirclePermission";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CircleGateProps<R extends CircleResource> {
  resource: R;
  action: CircleActions[R];
  /**
   * Resource data for data-dependent permission checks.
   * Required when the policy entry is a function (e.g. remove, updateRole).
   * Without it, function-based checks return false.
   */
  data?: ResourceData[R];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /**
   * When true, function-based permissions are treated as denied even without data.
   * Use for bulk/unconditional actions where you need a hard static guarantee.
   */
  strict?: boolean;
}

interface RoleGateProps {
  minRole: MemberRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ExactRoleGateProps {
  role: MemberRole | MemberRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// ─── Components ──────────────────────────────────────────────────────────────

/**
 * Renders `children` only when the current user can perform `action` on `resource`.
 *
 * For static permissions (boolean policy entries) no data is needed.
 * For data-dependent permissions pass the resource via the `data` prop so the
 * policy function can evaluate it — same as calling `can(resource, action, data)`.
 *
 * @example
 * // Static — no data needed
 * <CircleGate resource="circles" action="update">
 *   <SaveButton />
 * </CircleGate>
 *
 * // Data-dependent — pass the member so the policy can check their role
 * <CircleGate resource="circleMembers" action="remove" data={{ role: member.role, userId: member.userId }}>
 *   <RemoveMemberButton />
 * </CircleGate>
 *
 * // Strict — hard static guarantee, no function pass-through
 * <CircleGate resource="circles" action="delete" strict>
 *   <DeleteCircleButton />
 * </CircleGate>
 *
 * // With fallback
 * <CircleGate resource="circles" action="delete" strict fallback={<ReadOnlyNotice />}>
 *   <DeleteCircleButton />
 * </CircleGate>
 */
export function CircleGate<R extends CircleResource>({
  resource,
  action,
  data,
  children,
  fallback = null,
  strict = false,
}: CircleGateProps<R>) {
  const { can, canDefinitely } = useCirclePermission();

  const allowed = strict
    ? canDefinitely(resource, action)
    : can(resource, action, data);

  return allowed ? <>{children}</> : <>{fallback}</>;
}

/**
 * Renders `children` only when the current user's role is at least `minRole`.
 *
 * @example
 * <RoleGate minRole="MODERATOR">
 *   <ModerationPanel />
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
