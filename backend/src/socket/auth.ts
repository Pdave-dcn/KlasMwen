import jwt from "jsonwebtoken";

import prisma from "../core/config/db.js";
import env from "../core/config/env.js";

import { parseCookies } from "./utils/parseCookies.js";

import type { JwtPayload } from "../core/config/strategies/jwtStrategy.js";
import type { Socket, ExtendedError } from "socket.io";

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: ExtendedError) => void
) => {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const token = cookies.token;

    if (!token) {
      return next(new Error("Authentication required") as ExtendedError);
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    if (!payload.id) {
      return next(new Error("Invalid token payload") as ExtendedError);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      return next(new Error("User not found") as ExtendedError);
    }

    socket.data.user = user;

    next();
  } catch (error) {
    next(error as ExtendedError);
  }
};
