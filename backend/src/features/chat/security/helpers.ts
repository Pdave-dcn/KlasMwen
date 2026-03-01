type CircleResource = {
  creator?: { id: string };
  creatorId?: string;
};

type MessageResource = {
  sender?: { id: string };
  senderId?: string;
};

type MemberResource = {
  user?: { id: string };
  userId?: string;
};

/**
 * Extracts the creator's unique identifier from a circle object.
 *
 * @template TResource - A type that extends the base CircleResource structure.
 * @param {TResource} resource - The circle object to check for a creator ID.
 * @returns {string | undefined} The extracted creator ID, or `undefined` if not found.
 *
 * @example
 * getCreatorId({ creator: { id: "u1" } }) => "u1"
 * getCreatorId({ creatorId: "u1" }) => "u1"
 */
const getCreatorId = <TResource extends CircleResource>(
  resource: TResource,
): string | undefined => {
  if (!resource) return undefined;
  return resource.creator?.id ?? resource.creatorId ?? undefined;
};

/**
 * Extracts the sender's unique identifier from a message object.
 *
 * @template TResource - A type that extends the base MessageResource structure.
 * @param {TResource} resource - The message object to check for a sender ID.
 * @returns {string | undefined} The extracted sender ID, or `undefined` if not found.
 *
 * @example
 * getSenderId({ sender: { id: "u1" } }) => "u1"
 * getSenderId({ senderId: "u1" }) => "u1"
 */
const getSenderId = <TResource extends MessageResource>(
  resource: TResource,
): string | undefined => {
  if (!resource) return undefined;
  return resource.sender?.id ?? resource.senderId ?? undefined;
};

/**
 * Extracts the user's unique identifier from a member object.
 *
 * @template TResource - A type that extends the base MemberResource structure.
 * @param {TResource} resource - The member object to check for a user ID.
 * @returns {string | undefined} The extracted user ID, or `undefined` if not found.
 *
 * @example
 * getMemberId({ user: { id: "u1" } }) => "u1"
 * getMemberId({ userId: "u1" }) => "u1"
 */
const getMemberId = <TResource extends MemberResource>(
  resource: TResource,
): string | undefined => {
  if (!resource) return undefined;
  return resource.user?.id ?? resource.userId ?? undefined;
};

/**
 * Checks if a user is the creator of a circle.
 *
 * @template TResource - A type that extends the base CircleResource structure.
 * @param {{ id: string }} user - The user object with an `id` property.
 * @param {TResource} resource - The circle to check ownership.
 * @returns {boolean} `true` if the user is the creator, otherwise `false`.
 */
const isCreator = <TResource extends CircleResource>(
  user: Express.User,
  resource: TResource,
) => user.id === getCreatorId(resource);

/**
 * Checks if a user is the sender of a message.
 *
 * @template TResource - A type that extends the base MessageResource structure.
 * @param {{ id: string }} user - The user object with an `id` property.
 * @param {TResource} resource - The message to check ownership.
 * @returns {boolean} `true` if the user is the sender, otherwise `false`.
 */
const isSender = <TResource extends MessageResource>(
  user: Omit<Express.User, "email">,
  resource: TResource,
) => user.id === getSenderId(resource);

/**
 * Checks if a user matches a member resource.
 *
 * @template TResource - A type that extends the base MemberResource structure.
 * @param {{ id: string }} user - The user object with an `id` property.
 * @param {TResource} resource - The member resource to check.
 * @returns {boolean} `true` if the user matches the member, otherwise `false`.
 */
const isMemberUser = <TResource extends MemberResource>(
  user: Omit<Express.User, "email">,
  resource: TResource,
) => user.id === getMemberId(resource);

/**
 * Checks if a user has a specific circle role.
 *
 * @param {Express.User & { circleRole?: string }} user - User with optional circleRole.
 * @param {string | string[]} roles - Role or array of roles to check against.
 * @returns {boolean} `true` if user has one of the specified roles.
 */
const hasRole = (
  user: Omit<Express.User, "email"> & { circleRole?: string },
  roles: string | string[],
): boolean => {
  if (!user.circleRole) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.circleRole);
};

export {
  getCreatorId,
  getSenderId,
  getMemberId,
  isCreator,
  isSender,
  isMemberUser,
  hasRole,
};
