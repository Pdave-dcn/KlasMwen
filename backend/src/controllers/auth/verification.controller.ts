import jwt from "jsonwebtoken";

import { createLogger } from "../../core/config/logger.js";
import createActionLogger from "../../utils/logger.util.js";

import type { JwtPayload } from "../../core/config/strategies/jwtStrategy.js";
import type { NextFunction, Request, Response } from "express";

const controllerLogger = createLogger({ module: "AuthController" });

export const verifyAuth = (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "verifyAuth", req);
  try {
    actionLogger.info("User authentication verification attempt started");
    const startTime = Date.now();

    actionLogger.debug("Retrieving token");
    const token = req.cookies.token;

    if (!token) {
      actionLogger.warn("No authentication token provided");
      return res.status(401).json({
        message: "No authentication token provided",
      });
    }

    actionLogger.debug("Retrieving jwt secret");
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      actionLogger.error("JWT_SECRET not defined in environment variables");
      return res.status(500).json({
        message: "Server configuration error",
      });
    }

    actionLogger.debug("Token verification");
    const payload = jwt.verify(token, jwtSecret) as JwtPayload;

    const verificationDuration = Date.now() - startTime;

    actionLogger.info(
      {
        userId: payload.id,
        username: payload.username,
        verificationDuration,
      },
      "Verification complete"
    );

    return res.status(200).json({
      user: {
        id: payload.id,
        username: payload.username,
        email: payload.email,
        role: payload.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};
