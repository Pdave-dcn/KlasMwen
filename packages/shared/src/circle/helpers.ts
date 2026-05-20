import type { CircleRole, WithCreatorId, WithMembershipRole, WithSenderId } from "./types.js";

const getCreatorId = (resource: WithCreatorId): string | undefined => {
  if (!resource) return undefined;
  return resource.creator?.id ?? resource.creatorId ?? undefined;
};

const getSenderId = (resource: WithSenderId): string | undefined => {
  if (!resource) return undefined;
  return resource.sender?.id ?? resource.senderId ?? undefined;
};

const getMemberId = (resource: WithMembershipRole): string | undefined => {
  if (!resource) return undefined;
  return resource.user?.id ?? resource.userId ?? undefined;
};

const isCreator = (user: { id: string }, resource: WithCreatorId): boolean =>
  user.id === getCreatorId(resource);

const isSender = (user: { id: string }, resource: WithSenderId): boolean =>
  user.id === getSenderId(resource);

const hasRole = (
  user: { circleRole?: CircleRole },
  roles: CircleRole | CircleRole[],
): boolean => {
  if (!user.circleRole) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.circleRole);
};

export { getCreatorId, getSenderId, getMemberId, isCreator, isSender, hasRole };
