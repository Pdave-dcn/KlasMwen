import pino from "pino";

const baseLogger = pino({
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname,env,version",
          },
        }
      : undefined,
  level: process.env.LOG_LEVEL ?? "info",
  ...(process.env.NODE_ENV !== "development" && {
    base: {
      env: process.env.NODE_ENV,
      version: process.env.npm_package_version,
    },
  }),
});

/**
 * Creates a child logger with additional context fields.
 *
 * This function creates a new logger instance that inherits all configuration
 * from the base logger while adding custom context fields that will be included
 * in every log entry from this logger instance.
 *
 * @param {Record<string, string>} context - Key-value pairs to be added as context to all log entries
 * @returns {pino.Logger} A child logger instance with the provided context
 *
 * @example
 * const logger = createLogger({ module: 'auth', userId: '123' });
 * logger.info('User logged in'); // Will include module and userId in the log
 */
const createLogger = (context: Record<string, string>) =>
  baseLogger.child(context);

export { createLogger, baseLogger as logger };
