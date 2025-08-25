import { Strategy as JwtStrategy } from "passport-jwt";

import prisma from "../db.js";

import type { Request } from "express";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface JwtPayload {
  id: string;
  username: string;
  email: string;
  role: string;
}

type DoneCallback = (
  error: Error | null,
  user?: User | false,
  info?: unknown
) => void;

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET not defined in environment variables");
}

const cookieExtractor = (req: Request) => {
  if (req?.cookies) {
    return req.cookies["token"];
  }

  return null;
};

const jwtOptions = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: jwtSecret,
};

const jwtStrategy = new JwtStrategy(
  jwtOptions,
  async (payload: JwtPayload, done: DoneCallback) => {
    try {
      if (!payload.id) {
        return done(null, false);
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.id },
      });

      if (!user) {
        return done(null, false);
      }

      done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }
);

export default jwtStrategy;
