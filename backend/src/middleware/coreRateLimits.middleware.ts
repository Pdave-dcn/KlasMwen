import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import RateLimitError from "../core/error/custom/rateLimit.error.js";

import type { Request, Response } from "express";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: () => {
    throw new RateLimitError(
      "Too many authentication attempts. Please wait 15 minutes."
    );
  },
  keyGenerator: (req: Request, _res: Response) => {
    if (req.user) return req.user.id;

    if (req.ip) return ipKeyGenerator(req.ip);

    return "unknown";
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  handler: () => {
    throw new RateLimitError("Too many accounts created. Please wait 1 hour.");
  },
});

const writeOperationsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  handler: () => {
    throw new RateLimitError(
      "You've reached the hourly limit. You can make up to 10 changes (create, update, or delete) per hour. Please try again later."
    );
  },
  keyGenerator: (req: Request, _res: Response) => {
    if (req.user) return req.user.id;

    if (req.ip) return ipKeyGenerator(req.ip);

    return "unknown";
  },
});

const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  handler: () => {
    throw new RateLimitError(
      "Download limit reached. You can download up to 3 files per hour. Please try again later."
    );
  },
  keyGenerator: (req: Request, _res: Response) => {
    if (req.user) return `download:${req.user.id}`;

    if (req.ip) return `download:${ipKeyGenerator(req.ip)}`;

    return "download:unknown";
  },
  skipFailedRequests: true,
  skip: (_req: Request) => {
    return false;
  },
});

const reactionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500,
  handler: () => {
    throw new RateLimitError("Reaction limit reached. Please try again later.");
  },
  keyGenerator: (req: Request, _res: Response) => {
    if (req.user) return req.user.id;

    if (req.ip) return ipKeyGenerator(req.ip);

    return "unknown";
  },
});

/**
 * Rate limiter for creating reports
 * Prevents abuse by limiting report submissions to 5 per hour per user
 */
const reportCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  handler: () => {
    throw new RateLimitError(
      "Too many reports submitted. You can report up to 5 items per hour. Please try again later."
    );
  },
  keyGenerator: (req: Request, _res: Response) => {
    if (req.user) return `report:create:${req.user.id}`;

    if (req.ip) return `report:create:${ipKeyGenerator(req.ip)}`;

    return "report:create:unknown";
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: true, // Don't count failed attempts
});

/**
 * Rate limiter for moderator report actions
 * Limits status updates, visibility toggles, and deletions to 50 per hour
 */
const reportModerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  handler: () => {
    throw new RateLimitError(
      "Moderation action limit reached. You can perform up to 50 moderation actions per hour. Please try again later."
    );
  },
  keyGenerator: (req: Request, _res: Response) => {
    if (req.user) return `report:moderate:${req.user.id}`;

    if (req.ip) return `report:moderate:${ipKeyGenerator(req.ip)}`;

    return "report:moderate:unknown";
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
});

const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  handler: () => {
    throw new RateLimitError("API rate limit exceeded. Please slow down.");
  },
});

export {
  authLimiter,
  registerLimiter,
  writeOperationsLimiter,
  reactionLimiter,
  generalApiLimiter,
  downloadLimiter,
  reportCreationLimiter,
  reportModerationLimiter,
};
