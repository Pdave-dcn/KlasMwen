import {
  AuthenticationError,
  AuthorizationError,
} from "../core/error/custom/auth.error";

import type { Request } from "express";

type Resource = {
  author?: { id: string };
  authorId?: string;
};

/**
 * Checks if the provided user object has the "ADMIN" role.
 * This is a simple guard to ensure only administrators can perform certain actions.
 *
 * @param {(Express.User | undefined)} user - The Express user object to check.
 * @returns {boolean} True if the user is an "ADMIN".
 * @throws {AuthorizationError} If the user is not an admin.
 */
const checkAdminAuth = (user: Express.User | undefined): boolean => {
  if (user?.role !== "ADMIN") {
    throw new AuthorizationError();
  }
  return true;
};

/**
 * Ensures that the incoming request has an authenticated user with a valid ID.
 * Validates both the presence of the user object and that it contains the required ID field.
 *
 * @param {Request} req - The Express request object to check.
 * @returns {Express.User} The authenticated user object with validated structure.
 * @throws {AuthenticationError} If no authenticated user is found on the request.
 * @throws {AuthenticationError} If the user object is missing the required ID field or ID is invalid.
 */
const ensureAuthenticated = (req: Request) => {
  if (!req.user) {
    throw new AuthenticationError("No user found in request");
  }

  if (
    !req.user.id ||
    typeof req.user.id !== "string" ||
    req.user.id.trim().length === 0
  ) {
    throw new AuthenticationError("User object missing required ID field");
  }

  return req.user;
};

/**
 * Checks whether the user has permission to interact with a resource.
 * The user must be the resource's author, or an admin if `allowAdminBypass` is true.
 *
 * Supports resources with either:
 * - `author.id` (nested author object)
 * - `authorId` (flat field)
 *
 * @template T - Resource type with either `author.id` or `authorId`.
 * @param {Express.User} user - The currently authenticated user.
 * @param {T} resource - The resource to check.
 * @param {boolean} [allowAdminBypass=true] - Whether admins can bypass ownership.
 * @throws {AuthorizationError} If the user is not authorized.
 */
const checkPermission = <T extends Resource>(
  user: Express.User,
  resource: T,
  allowAdminByPass = true
) => {
  const resourceAuthorId = resource.author?.id ?? resource.authorId;
  if (!resourceAuthorId)
    throw new Error("Resource does not have an author or authorId field");

  if (
    user.id !== resourceAuthorId &&
    !(allowAdminByPass && user.role === "ADMIN")
  )
    throw new AuthorizationError();
};

export { checkAdminAuth, ensureAuthenticated, checkPermission };
