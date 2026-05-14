import jwt from "jsonwebtoken";

import env from "../../core/config/env.js";
import { UserNotFoundError } from "../../core/error/custom/user.error.js";
import UserService from "../../features/user/service/UserService.js";
import { parseCookies } from "../utils/parseCookies.js";

import type { JwtPayload } from "../../core/config/strategies/jwtStrategy.js";
import type { Socket, ExtendedError } from "socket.io";

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: ExtendedError) => void,
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

    const user = await UserService.getUserForSocket(payload.id);

    socket.data.user = user;

    next();
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return next(new Error("User not found") as ExtendedError);
    }
    next(error as ExtendedError);
  }
};
