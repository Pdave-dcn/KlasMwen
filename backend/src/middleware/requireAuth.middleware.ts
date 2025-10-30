import passport from "passport";

/**
 * Middleware to protect routes that require authentication.
 *
 * Validates JWT tokens from the Authorization header using Passport's JWT strategy.
 * The `session: false` option ensures stateless authentication - no session data is
 * stored on the server, making the API truly RESTful and scalable.
 *
 * @remarks
 * - If authentication succeeds, `req.user` is populated with the decoded JWT payload
 * - If authentication fails (missing, invalid, or expired token), returns 401 Unauthorized
 * - This middleware should be applied to any route that requires a logged-in user
 *
 * @example
 * // Protecting a single route
 * router.get('/profile', requireAuth, getUserProfile);
 *
 * @example
 * // Protecting multiple routes
 * router.use('/posts', requireAuth);
 * router.post('/posts', createPost);
 * router.put('/posts/:id', updatePost);
 */
export const requireAuth = passport.authenticate("jwt", { session: false });
