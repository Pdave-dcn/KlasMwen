import type { WithAuthorId, WithUserId } from "./types.js";

const getAuthorId = (resource: WithAuthorId): string | undefined => {
  if (!resource) return undefined;
  return resource.author?.id ?? resource.authorId ?? undefined;
};

const getUserId = (resource: WithUserId): string | undefined => {
  if (!resource) return undefined;
  return resource.user?.id ?? resource.userId ?? undefined;
};

const isOwner = (user: { id: string }, resource: WithAuthorId): boolean =>
  user.id === getAuthorId(resource);

const isNotOwner = (user: { id: string }, resource: WithAuthorId): boolean =>
  user.id !== getAuthorId(resource);

const isReceiver = (user: { id: string }, resource: WithUserId): boolean =>
  user.id === getUserId(resource);

export { getAuthorId, getUserId, isOwner, isNotOwner, isReceiver };
export type { WithAuthorId, WithUserId };
