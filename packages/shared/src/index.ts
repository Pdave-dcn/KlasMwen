export { createRbac, createAssert } from "./rbac.js";

export { registry } from "./types.js";
export type {
  UserRole,
  Registry,
  PostForPolicy,
  CommentForPolicy,
  NotificationForPolicy,
} from "./types.js";

export {
  getAuthorId,
  getUserId,
  isOwner,
  isNotOwner,
  isReceiver,
} from "./helpers.js";
export type { WithAuthorId, WithUserId } from "./helpers.js";

export { POLICY } from "./policy.js";

// Circle exports
export { circleRegistry } from "./circle/types.js";
export type {
  CircleRegistry,
  CircleForPolicy,
  CircleMemberForPolicy,
  CircleMessageForPolicy,
  CircleRole,
} from "./circle/types.js";
export {
  getCreatorId,
  getSenderId,
  getMemberId,
  isCreator,
  isSender,
  hasRole,
} from "./circle/helpers.js";
export { CIRCLE_POLICY } from "./circle/policy.js";
