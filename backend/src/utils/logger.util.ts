import type { Request } from "express";
import type { Logger } from "pino";

/**
 * Creates a scoped logger for a specific controller action with request tracing.
 *
 * This helper standardizes logging within controller methods by creating a child logger
 * that automatically includes:
 * - The action name (e.g., 'createUser', 'updateProfile') for filtering logs by operation
 * - The requestId for tracing all logs related to a single HTTP request across the application
 *
 * Using this ensures consistent log structure across all controller actions and enables
 * easy correlation of logs when debugging issues or monitoring specific requests.
 *
 * @param controllerLogger - The base logger for the controller (created via createLogger)
 * @param action - The name of the controller action/method being executed (e.g., 'login', 'getUserById')
 * @param req - Express request object with logContext.requestId attached by logging middleware
 * @returns Logger instance that includes action and requestId in all subsequent log entries
 *
 * @example
 * // In a controller method
 * const logger = createActionLogger(controllerLogger, 'createUser', req);
 * logger.info('Validating user input');  // Logs: { action: 'createUser', requestId: '...', msg: 'Validating user input' }
 * logger.error({ error }, 'Failed to create user');  // Same context automatically included
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
