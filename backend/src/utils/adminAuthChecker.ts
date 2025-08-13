/**
 * Checks if the provided user object has the "ADMIN" role.
 * This is a simple guard to ensure only administrators can perform certain actions.
 *
 * @param {(Express.User | undefined)} user - The Express user object to check.
 * @return {boolean} True if the user is an "ADMIN", otherwise false.
 */
const checkAdminAuth = (user: Express.User | undefined): boolean => {
  return user?.role === "ADMIN";
};

export default checkAdminAuth;
