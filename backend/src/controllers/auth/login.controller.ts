/* eslint-disable */
import passport from "passport";

import { createLogger } from "../../core/config/logger.js";
import { handleError } from "../../core/error/index.js";

import { UserService } from "./register.controller.js";

import type { Request, Response, NextFunction } from "express";
import createActionLogger from "../../utils/logger.util.js";

const controllerLogger = createLogger({ module: "AuthController" });

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

// Authentication callback
const handleAuthenticationResult = (
  req: Request,
  res: Response,
  next: NextFunction,
  error: Error | null,
  user: User | false | null,
  info: { message: string } | undefined,
  startTime: number
) => {
  const actionLogger = controllerLogger.child({
    action: "handleAuthenticationResult",
    requestId: req.logContext?.requestId,
  });

  try {
    if (error) {
      actionLogger.error(
        {
          errorType: error.constructor.name,
          errorDescription: error.message,
        },
        "Authentication error occurred"
      );
      return next(error);
    }

    if (!user) {
      const totalDuration = Date.now() - startTime;
      actionLogger.warn(
        {
          reason: info?.message ?? "Invalid credentials",
          totalDuration,
        },
        "Login attempt failed - invalid credentials"
      );

      return res.status(401).json({
        message: info?.message ?? "Invalid credentials",
      });
    }

    actionLogger.info(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      "User authentication successful, generating token"
    );

    const token = UserService.generateToken(user);

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        totalDuration,
      },
      "Login completed successfully"
    );

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const loginUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const actionLogger = createActionLogger(controllerLogger, "loginUser", req);

  try {
    actionLogger.info("User login attempt started");
    const startTime = Date.now();

    const requestBody = req.body;
    const emailDomain = requestBody?.email
      ? requestBody.email.split("@")[1]
      : "unknown";
    const username = requestBody?.username ?? "unknown";

    actionLogger.debug(
      {
        hasEmail: !!requestBody?.email,
        hasPassword: !!requestBody?.password,
        emailDomain,
        username,
      },
      "Login request received with credentials"
    );

    actionLogger.debug("Initiating passport authentication");

    passport.authenticate(
      "local",
      { session: false },
      (
        error: Error | null,
        user: User | false | null,
        info: { message: string } | undefined
      ) => {
        actionLogger.debug(
          {
            hasError: !!error,
            hasUser: !!user,
            hasInfo: !!info,
            infoMessage: info?.message,
          },
          "Passport authentication completed"
        );

        return handleAuthenticationResult(
          req,
          res,
          next,
          error,
          user,
          info,
          startTime
        );
      }
    )(req, res, next);
  } catch (error: unknown) {
    handleError(error, res);
  }
};
