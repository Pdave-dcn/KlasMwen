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
  // Skip failed requests (don't count towards limit if download fails)
  skipFailedRequests: true,
  // Skip successful requests that were aborted by the client
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
};
