import env from "./env.js";

import type { CookieOptions } from "express";

/**
 * Get cookie configuration based on environment
 * @returns Cookie options object
 */
const getCookieConfig = (): CookieOptions => {
  const isProduction = env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    path: "/",
  };
};

/**
 * Get cookie clear configuration (without maxAge)
 * Used for clearing cookies on logout
 * @returns Cookie options object for clearing
 */
const getClearCookieConfig = (): CookieOptions => {
  const isProduction = env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };
};

export { getCookieConfig, getClearCookieConfig };
