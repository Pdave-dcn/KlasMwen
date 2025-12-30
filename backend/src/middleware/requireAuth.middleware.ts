import passport from "passport";

import type { Request, Response, NextFunction } from "express";

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
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "jwt",
    { session: false },
    (err: unknown, user: Express.User | false) => {
      if (err) {
        req.log.error({ err }, "JWT authentication error");
        return next(err);
      }

      if (!user) {
        req.log.warn(
          {
            path: req.originalUrl,
            ip: req.ip,
          },
          "Unauthenticated request"
        );
        return res.status(401).json({ message: "Unauthenticated" });
      }

      req.user = user;

      req.log.info(
        {
          userId: user.id,
          role: user.role,
        },
        "User authenticated successfully"
      );

      next();
    }
  )(req, res, next);
};
