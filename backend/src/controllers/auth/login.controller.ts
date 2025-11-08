/* eslint-disable max-lines-per-function */
/* eslint-disable max-params */
import passport from "passport";

import env from "../../core/config/env.js";
import { createLogger } from "../../core/config/logger.js";
import { handleError } from "../../core/error/index.js";
import UserService from "../../features/user/service/UserService.js";
import createActionLogger from "../../utils/logger.util.js";

import type { Request, Response, NextFunction } from "express";

const controllerLogger = createLogger({ module: "AuthController" });

interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  role: string;
  Avatar: {
    id: number;
    url: string;
  } | null;
}

/**
 * Handle authentication result from passport
 */
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
    // Handle authentication error
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

    // Handle failed authentication
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

    // Process successful login through service layer
    actionLogger.info(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      "User authentication successful, processing login"
    );

    const { user: userData, token } = UserService.processLogin(user);

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        userId: userData.id,
        username: userData.username,
        role: userData.role,
        totalDuration,
      },
      "Login completed successfully"
    );

    // Set cookie
    const isProduction = env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    // Send response
    return res.status(200).json({
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * Controller for user login
 * Handles passport authentication and delegates business logic to service
 */
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

    // Passport authentication
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
