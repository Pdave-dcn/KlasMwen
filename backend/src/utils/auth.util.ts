import {
  AuthenticationError,
  AuthorizationError,
} from "../core/error/custom/auth.error";

import type { Request } from "express";

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
 * Checks if the provided user object has either "ADMIN" or "MODERATOR" role.
 * This guard ensures only users with moderation privileges can perform certain actions.
 *
 * @param {(Express.User | undefined)} user - The Express user object to check.
 * @returns {boolean} True if the user is either an "ADMIN" or "MODERATOR".
 * @throws {AuthorizationError} If the user is neither an admin nor a moderator.
 */
const checkModeratorAuth = (user: Express.User | undefined): boolean => {
  if (user?.role !== "ADMIN" && user?.role !== "MODERATOR") {
    throw new AuthorizationError(
      "Access denied. Admin or Moderator role required."
    );
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

export { checkAdminAuth, checkModeratorAuth, ensureAuthenticated };
