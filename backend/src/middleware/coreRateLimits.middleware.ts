import rateLimit, { type Options } from "express-rate-limit";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
}

const createRateLimiter = ({
  windowMs,
  max,
  message,
  skipFailedRequests = false,
  skipSuccessfulRequests = false,
}: RateLimitConfig) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests,
    skipSuccessfulRequests,
    message: {
      code: "RATE_LIMIT_EXCEEDED",
      message,
    },
  } satisfies Partial<Options>);
};

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many authentication attempts. Please wait 15 minutes.",
});

const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: "Too many accounts created. Please wait 1 hour.",
});

const writeOperationsLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message:
    "You've reached the hourly limit. You can make up to 10 changes (create, update, or delete) per hour. Please try again later.",
});

const downloadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message:
    "Download limit reached. You can download up to 3 files per hour. Please try again later.",
  skipFailedRequests: true,
});

const reactionLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500,
  message: "Reaction limit reached. Please try again later.",
});

const reportCreationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message:
    "Too many reports submitted. You can report up to 5 items per hour. Please try again later.",
  skipFailedRequests: true,
});

const reportModerationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message:
    "Moderation action limit reached. You can perform up to 50 moderation actions per hour. Please try again later.",
  skipFailedRequests: true,
});

const generalApiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: "API rate limit exceeded. Please slow down.",
});

export {
  authLimiter,
  registerLimiter,
  writeOperationsLimiter,
  downloadLimiter,
  reactionLimiter,
  reportCreationLimiter,
  reportModerationLimiter,
  generalApiLimiter,
};
