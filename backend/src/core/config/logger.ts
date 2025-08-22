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

const createLogger = (context: Record<string, string>) =>
  baseLogger.child(context);

export { createLogger, baseLogger as logger };
