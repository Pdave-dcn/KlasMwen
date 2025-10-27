import type { Request, Response, NextFunction } from "express";

/**
 * Express middleware factory that attaches logging context to incoming requests.
 *
 * This middleware is the foundation of the request tracing system. It ensures every
 * request has a unique identifier and standardized metadata that flows through all
 * subsequent logs, making it possible to trace the entire lifecycle of a request
 * across controllers, services, and database operations.
 *
 * **How it works:**
 * 1. Checks for existing `x-request-id` header (from load balancers, API gateways, or clients)
 * 2. Generates a new requestId if none exists (format: `req-{timestamp}-{random}`)
 * 3. Attaches logContext object to the request for use by createActionLogger and other loggers
 *
 * **Why this matters:**
 * - Enables distributed tracing across microservices when request IDs are propagated
 * - Makes debugging production issues dramatically easier by filtering logs by requestId
 * - Provides consistent metadata (module, IP) for security auditing and monitoring
 *
 * @param {string} moduleName - The name of the module/router (e.g., 'auth', 'users', 'orders')
 *                              to identify which part of the app is handling the request
 * @return {Function} Express middleware function that attaches logContext to req object
 *
 * @example
 * // In your router setup
 * import express from 'express';
 * import attachLogContext from './middleware/attachLogContext';
 *
 * const userRouter = express.Router();
 * userRouter.use(attachLogContext('users'));  // All user routes get module: 'users'
 *
 * userRouter.get('/:id', (req, res) => {
 *   // req.logContext is now available:
 *   // { module: 'users', requestId: 'req-1234567890-abc123xyz', ip: '192.168.1.1' }
 *   const logger = createActionLogger(controllerLogger, 'getUserById', req);
 * });
 *
 * @example
 * // Client sending request with existing trace ID
 * fetch('/api/users', {
 *   headers: { 'x-request-id': 'trace-from-frontend-abc123' }
 * });
 * // The existing ID will be preserved for end-to-end tracing
 */
const attachLogContext = (moduleName: string) => {
  return (
    req: Request & { logContext?: Express.LogContext },
    _res: Response,
    next: NextFunction
  ) => {
    const requestId =
      (req.headers?.["x-request-id"] as string | undefined) ??
      `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    req.logContext = {
      module: moduleName,
      requestId,
      ip: req.ip ?? "unknown",
    };

    next();
  };
};

export default attachLogContext;
