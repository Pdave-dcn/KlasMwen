/**
 * Derives a union of role keys from the policy object at the type level.
 */
type RolesOf<P> = keyof P & string;

/**
 * A permission entry for a given resource and user type:
 * - `true`/`false` for static grants
 * - A predicate receiving (user, data) for dynamic checks
 */
type PermissionEntry<UserT, DataT> =
  | boolean
  | ((user: UserT, data: DataT) => boolean);

/**
 * Derives the full policy shape from the registry and user type.
 * Roles are open at this level (the closed constraint is enforced via the
 * RoleT generic at the factory call-site).
 */
type PolicyMap<
  RegT extends Record<string, { datatype: unknown; action: readonly string[] }>,
  UserT,
> = Record<
  string,
  {
    [Res in keyof RegT]?: {
      [Act in RegT[Res]["action"][number]]?: PermissionEntry<
        UserT,
        RegT[Res]["datatype"]
      >;
    };
  }
>;

/**
 * Narrows a PermissionEntry to only the function variant.
 */
type FunctionPermission<UserT, DataT> = (user: UserT, data: DataT) => boolean;

/**
 * Returns true if the entry is a function-based permission.
 */
function isFunctionPermission<UserT, DataT>(
  p: PermissionEntry<UserT, DataT>,
): p is FunctionPermission<UserT, DataT> {
  return typeof p === "function";
}

// ---------------------------------------------------------------------------
// Overload signatures for hasPermission
// ---------------------------------------------------------------------------

/**
 * Overload 1 — resource has a non-void datatype: data is required.
 * Overload 2 — resource datatype is void/undefined: data is forbidden.
 *
 * This makes omitting data on a data-gated action a compile-time error
 * rather than a silent runtime `false`.
 */
type HasPermission<
  RegT extends Record<string, { datatype: unknown; action: readonly string[] }>,
  UserT,
> = {
  <Res extends keyof RegT & string>(
    user: UserT,
    resource: Res,
    action: RegT[Res]["action"][number],
    data: RegT[Res]["datatype"],
  ): boolean;
  <Res extends keyof RegT & string>(
    user: UserT,
    resource: Res,
    action: RegT[Res]["action"][number],
  ): boolean;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createRbac<
  RegT extends Record<string, { datatype: unknown; action: readonly string[] }>,
  UserT,
  PolicyT extends PolicyMap<RegT, UserT>,
>(
  _registry: RegT,
  policy: PolicyT,
  getRole: (user: UserT) => RolesOf<PolicyT> | undefined,
) {
  type Role = RolesOf<PolicyT>;

  const hasPermission = <Res extends keyof RegT & string>(
    user: UserT,
    resource: Res,
    action: RegT[Res]["action"][number],
    data?: RegT[Res]["datatype"],
  ): boolean => {
    const role: Role | undefined = getRole(user);

    if (!role) return false;

    const permission = (policy[role] as PolicyMap<RegT, UserT>[Role])?.[
      resource
    ]?.[action as RegT[Res]["action"][number]];

    if (permission === undefined) return false;
    if (!isFunctionPermission(permission)) return permission;

    if (data === undefined) return false;

    return permission(user, data);
  };

  return { hasPermission: hasPermission as HasPermission<RegT, UserT> };
}

export function createAssert<
  RegT extends Record<string, { datatype: unknown; action: readonly string[] }>,
  UserT,
>(
  hasPermission: HasPermission<RegT, UserT>,
  buildMessage: (user: UserT, resource: string, action: string) => string,
  ErrorClass: new (message: string) => Error,
) {
  function assertPermission<Res extends keyof RegT & string>(
    user: UserT,
    resource: Res,
    action: RegT[Res]["action"][number],
    data: RegT[Res]["datatype"],
  ): void;
  function assertPermission<Res extends keyof RegT & string>(
    user: UserT,
    resource: Res,
    action: RegT[Res]["action"][number],
  ): void;
  function assertPermission<Res extends keyof RegT & string>(
    user: UserT,
    resource: Res,
    action: RegT[Res]["action"][number],
    data?: RegT[Res]["datatype"],
  ): void {
    if (!hasPermission(user, resource, action, data as RegT[Res]["datatype"])) {
      throw new ErrorClass(buildMessage(user, resource, String(action)));
    }
  }

  return assertPermission;
}
