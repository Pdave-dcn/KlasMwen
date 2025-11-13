type Resource = {
  author?: { id: string };
  authorId?: string;
};

/**
 * Extracts the author's unique identifier from a given resource object.
 *
 * It checks for the author ID in two common formats:
 * 1. A nested object structure: `resource.author.id`.
 * 2. A flat field: `resource.authorId`.
 * The function returns the first valid ID found.
 *
 * @template TResource - A type that extends the base Resource structure.
 * @param {TResource} resource - The resource object (e.g., Post, Comment) to check for an author ID.
 * @returns {string | undefined} The extracted author ID, or `undefined` if neither field exists or is valid.
 *
 * @example
 * getAuthorId({ author: { id: "u1" } }) => "u1"
 * getAuthorId({ authorId: "u1" }) => "u1"
 * getAuthorId({ name: "data" }) => undefined
 */
const getAuthorId = <TResource extends Resource>(
  resource: TResource
): string | undefined => {
  if (!resource) return undefined;
  return resource.author?.id ?? resource.authorId ?? undefined;
};

/**
 * Checks if a given user is the author (owner) of a specific resource.
 *
 * This function compares the user's ID (`user.id`) with the author ID
 * extracted from the resource using `getAuthorId`.
 *
 * @template TResource - A type that extends the base Resource structure.
 * @param {{ id: string }} user - The user object, which must contain an `id` property.
 * @param {TResource} resource - The resource object to check for ownership.
 * @returns {boolean} `true` if the user's ID matches the resource's author ID, otherwise `false`.
 *
 * @example
 * // user is the owner
 * const user = { id: 'u1' };
 * const post = { authorId: 'u1' };
 * isOwner(user, post); // true
 *
 * // user is not the owner
 * const comment = { author: { id: 'u2' } };
 * isOwner(user, comment); // false
 */
const isOwner = <TResource extends Resource>(
  user: Express.User,
  resource: TResource
) => user.id === getAuthorId(resource);

export { getAuthorId, isOwner };
