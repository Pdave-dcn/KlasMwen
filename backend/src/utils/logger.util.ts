import type { Request } from "express";
import type { Logger } from "pino";

/**
 * Creates an action logger with standardized context from request
 * @param controllerLogger - The base controller logger
 * @param action - The specific action being performed
 * @param req - Express request object containing log context
 * @returns Logger instance with action and request context
 */

const createActionLogger = (
  controllerLogger: Logger,
  action: string,
  req: Request
): Logger => {
  return controllerLogger.child({
    action,
    requestId: req.logContext?.requestId,
  });
};

export default createActionLogger;
